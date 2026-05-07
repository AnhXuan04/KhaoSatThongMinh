package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VnPayProperties {
    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final String ipnUrl;
    private final String frontendReturnUrl;

    public VnPayProperties(
            @Value("${vnpay.tmnCode}") String tmnCode,
            @Value("${vnpay.hashSecret}") String hashSecret,
            @Value("${vnpay.payUrl}") String payUrl,
            @Value("${vnpay.returnUrl}") String returnUrl,
            @Value("${vnpay.ipnUrl}") String ipnUrl,
            @Value("${vnpay.frontendReturnUrl}") String frontendReturnUrl
    ) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.ipnUrl = ipnUrl;
        this.frontendReturnUrl = frontendReturnUrl;
    }

    public String getTmnCode() {
        return tmnCode;
    }

    public String getHashSecret() {
        return hashSecret;
    }

    public String getPayUrl() {
        return payUrl;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public String getIpnUrl() {
        return ipnUrl;
    }

    public String getFrontendReturnUrl() {
        return frontendReturnUrl;
    }
}

