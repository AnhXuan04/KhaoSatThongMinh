package com.example.demo.service;

import com.example.demo.config.VnPayProperties;
import com.example.demo.dto.PaymentHistoryItemDto;
import com.example.demo.dto.PaymentCreateRequest;
import com.example.demo.dto.PaymentCreateResponse;
import com.example.demo.entity.PaymentStatus;
import com.example.demo.entity.PaymentTransaction;
import com.example.demo.entity.Plan;
import com.example.demo.entity.User;
import com.example.demo.repository.PaymentTransactionRepository;
import com.example.demo.repository.PlanRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtils;
import com.example.demo.util.VnPayUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private static final String VNP_VERSION = "2.1.0";
    private static final String VNP_COMMAND = "pay";
    private static final String VNP_ORDER_TYPE = "other";
    private static final String VNP_CURR_CODE = "VND";
    private static final String VNP_LOCALE = "vn";

    @Autowired
    private VnPayProperties vnPayProperties;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private SubscriptionService subscriptionService;

    public PaymentCreateResponse createPayment(String authorizationHeader, PaymentCreateRequest request, String clientIp) {
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Gói không tồn tại."));

        BigDecimal amount = resolveAmount(plan, request.getBillingCycle());
        String txnRef = generateTxnRef();

        User user = null;
        String payerEmail = null;
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            String token = extractToken(authorizationHeader);
            String email = jwtUtils.getEmailFromJwtToken(token);
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
            payerEmail = user.getEmail();
        } else {
            if (request.getPayerEmail() == null || request.getPayerEmail().isBlank()) {
                throw new RuntimeException("Thiếu email người thanh toán.");
            }
            payerEmail = request.getPayerEmail().trim().toLowerCase(Locale.ROOT);
        }

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setUser(user);
        transaction.setPayerEmail(payerEmail);
        transaction.setPlan(plan);
        transaction.setBillingCycle(request.getBillingCycle());
        transaction.setAmount(amount);
        transaction.setStatus(PaymentStatus.PENDING);
        transaction.setVnpTxnRef(txnRef);
        transaction.setClaimed(false);
        paymentTransactionRepository.save(transaction);

        String payerLabel = user != null ? "User " + user.getId() : "Email " + payerEmail;
        Map<String, String> vnpParams = buildVnPayParams(txnRef, amount, clientIp, payerLabel, plan.getName());
        String query = VnPayUtils.buildQueryString(vnpParams);
        String hashData = VnPayUtils.buildHashData(vnpParams);
        String secureHash = VnPayUtils.hmacSHA512(vnPayProperties.getHashSecret(), hashData);
        String paymentUrl = vnPayProperties.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;

        PaymentCreateResponse response = new PaymentCreateResponse();
        response.setPaymentUrl(paymentUrl);
        response.setTxnRef(txnRef);
        return response;
    }

    public boolean handleReturn(Map<String, String> params) {
        if (!verifySignature(params)) {
            throw new RuntimeException("Chữ ký VNPay không hợp lệ.");
        }

        String txnRef = params.get("vnp_TxnRef");
        PaymentTransaction transaction = paymentTransactionRepository.findByVnpTxnRef(txnRef)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch."));

        updateTransactionFromParams(transaction, params);

        String responseCode = params.get("vnp_ResponseCode");
        boolean success = "00".equals(responseCode);
        log.info("[handleReturn] txnRef={} responseCode={} currentStatus={}", txnRef, responseCode, transaction.getStatus());
        if (success && transaction.getStatus() != PaymentStatus.SUCCESS) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            User user = transaction.getUser();
            log.info("[handleReturn] user={}", user != null ? user.getId() : "NULL");
            if (user != null) {
                try {
                    subscriptionService.applySubscription(user, transaction);
                    userRepository.save(user);
                    log.info("[handleReturn] subscription applied for user={}", user.getId());
                } catch (Exception e) {
                    log.error("[handleReturn] FAILED applySubscription for user={}", user.getId(), e);
                    throw e;
                }
            }
        } else if (!success) {
            transaction.setStatus(PaymentStatus.FAILED);
        }

        paymentTransactionRepository.save(transaction);
        return success;
    }

    public Map<String, String> handleIpn(Map<String, String> params) {
        Map<String, String> result = new HashMap<>();
        if (!verifySignature(params)) {
            result.put("RspCode", "97");
            result.put("Message", "Invalid signature");
            return result;
        }

        String txnRef = params.get("vnp_TxnRef");
        Optional<PaymentTransaction> optionalTransaction = paymentTransactionRepository.findByVnpTxnRef(txnRef);
        if (optionalTransaction.isEmpty()) {
            result.put("RspCode", "01");
            result.put("Message", "Order not found");
            return result;
        }

        PaymentTransaction transaction = optionalTransaction.get();
        updateTransactionFromParams(transaction, params);

        String responseCode = params.get("vnp_ResponseCode");
        boolean success = "00".equals(responseCode);
        log.info("[handleIpn] txnRef={} responseCode={} currentStatus={}", txnRef, responseCode, transaction.getStatus());
        if (success && transaction.getStatus() != PaymentStatus.SUCCESS) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            User user = transaction.getUser();
            log.info("[handleIpn] user={}", user != null ? user.getId() : "NULL");
            if (user != null) {
                try {
                    subscriptionService.applySubscription(user, transaction);
                    userRepository.save(user);
                    log.info("[handleIpn] subscription applied for user={}", user.getId());
                } catch (Exception e) {
                    log.error("[handleIpn] FAILED applySubscription for user={}", user.getId(), e);
                }
            }
        } else if (!success) {
            transaction.setStatus(PaymentStatus.FAILED);
        }

        paymentTransactionRepository.save(transaction);
        result.put("RspCode", "00");
        result.put("Message", "Confirm Success");
        return result;
    }

    public String getFrontendReturnUrl() {
        return vnPayProperties.getFrontendReturnUrl();
    }

    public String getPayerEmailByTxnRef(String txnRef) {
        if (txnRef == null || txnRef.isBlank()) {
            return "";
        }

        return paymentTransactionRepository.findByVnpTxnRef(txnRef)
                .map(PaymentTransaction::getPayerEmail)
                .orElse("");
    }

    public List<PaymentHistoryItemDto> getPaymentHistory(String email) {
        if (email == null || email.isBlank()) {
            return Collections.emptyList();
        }

        return paymentTransactionRepository.findByPayerEmailIgnoreCaseOrderByCreatedAtDesc(email.trim())
                .stream()
                .map(this::toHistoryItemDto)
                .collect(Collectors.toList());
    }

    private PaymentHistoryItemDto toHistoryItemDto(PaymentTransaction transaction) {
        PaymentHistoryItemDto dto = new PaymentHistoryItemDto();
        dto.setTxnRef(transaction.getVnpTxnRef());
        dto.setPlanName(resolvePlanName(transaction.getPlan()));
        dto.setBillingCycle(transaction.getBillingCycle());
        dto.setAmount(transaction.getAmount());
        dto.setStatus(transaction.getStatus() != null ? transaction.getStatus().name() : "PENDING");
        dto.setPaymentDate(resolvePaymentDate(transaction));
        return dto;
    }

    private String resolvePlanName(Plan plan) {
        if (plan == null) {
            return "Không xác định";
        }

        return plan.getName();
    }

    private LocalDateTime resolvePaymentDate(PaymentTransaction transaction) {
        if (transaction.getVnpPayDate() != null && transaction.getVnpPayDate().length() >= 14) {
            try {
                return LocalDateTime.parse(transaction.getVnpPayDate(), DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            } catch (Exception ignored) {
                // Fallback to createdAt below.
            }
        }

        return transaction.getCreatedAt();
    }

    private void updateTransactionFromParams(PaymentTransaction transaction, Map<String, String> params) {
        transaction.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        transaction.setVnpResponseCode(params.get("vnp_ResponseCode"));
        transaction.setVnpPayDate(params.get("vnp_PayDate"));
    }

    private boolean verifySignature(Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return false;
        }

        Map<String, String> data = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            if ("vnp_SecureHash".equals(key) || "vnp_SecureHashType".equals(key)) {
                continue;
            }
            if (entry.getValue() != null) {
                data.put(key, entry.getValue());
            }
        }

        String hashData = VnPayUtils.buildHashData(data);
        String expectedHash = VnPayUtils.hmacSHA512(vnPayProperties.getHashSecret(), hashData);
        return expectedHash.equalsIgnoreCase(secureHash);
    }

    private Map<String, String> buildVnPayParams(String txnRef, BigDecimal amount, String clientIp, String payerLabel, String planName) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", VNP_VERSION);
        params.put("vnp_Command", VNP_COMMAND);
        params.put("vnp_TmnCode", vnPayProperties.getTmnCode());
        params.put("vnp_Amount", amount.multiply(BigDecimal.valueOf(100)).toBigInteger().toString());
        params.put("vnp_CurrCode", VNP_CURR_CODE);
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toan goi " + planName + " - " + payerLabel);
        params.put("vnp_OrderType", VNP_ORDER_TYPE);
        params.put("vnp_Locale", VNP_LOCALE);
        params.put("vnp_ReturnUrl", vnPayProperties.getReturnUrl());
        params.put("vnp_IpAddr", clientIp);

        LocalDateTime now = LocalDateTime.now();
        params.put("vnp_CreateDate", now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        return params;
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Thiếu token đăng nhập.");
        }
        return authorizationHeader.substring(7);
    }

    private BigDecimal resolveAmount(Plan plan, String billingCycle) {
        if ("YEARLY".equalsIgnoreCase(billingCycle)) {
            return plan.getPriceYearly();
        }
        return plan.getPriceMonthly();
    }

    private String generateTxnRef() {
        return "VNP" + System.currentTimeMillis() + new Random().nextInt(9999);
    }
}

