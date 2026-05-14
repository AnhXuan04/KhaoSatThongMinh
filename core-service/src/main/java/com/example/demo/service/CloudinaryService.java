package com.example.demo.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud_name}") String cloudName,
            @Value("${cloudinary.api_key}") String apiKey,
            @Value("${cloudinary.api_secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret));
    }

    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        try {
            String resourceType = "auto";

            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "use_filename", true,
                    "unique_filename", true,
                    // ensure uploaded file is publicly accessible
                    "access_mode", "public");

            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            Map<String, Object> response = new HashMap<>();
            response.put("publicId", result.get("public_id"));
            response.put("secureUrl", result.get("secure_url"));
            response.put("resourceType", result.get("resource_type"));
            response.put("originalFileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            // Use file extension as format, not Cloudinary's format
            // Determine format from original filename (fallback to pdf)
            String origName = file.getOriginalFilename();
            String format = "pdf";
            if (origName != null && origName.contains(".")) {
                format = origName.substring(origName.lastIndexOf('.') + 1).toLowerCase();
            }
            response.put("format", format);

            log.info("File uploaded successfully: {}", result.get("public_id"));
            return response;
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw e;
        }
    }
    public void deleteFile(String publicId) {
        try {
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("File deleted successfully: {}", publicId);
        } catch (Exception e) {
            log.error("Failed to delete file: {}", e.getMessage());
        }
    }

    public Map<String, Object> uploadFileWithFolder(MultipartFile file, String folder) throws IOException {
        try {
            // Let Cloudinary auto-detect the resource type so office files can be uploaded too.
            String resourceType = "auto";

            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "type", "upload", 
                    "use_filename", true,
                    "unique_filename", true,
                    "folder", folder);

            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            Map<String, Object> response = new HashMap<>();
            response.put("publicId", result.get("public_id"));
            response.put("secureUrl", result.get("secure_url"));
            response.put("resourceType", result.get("resource_type"));
            response.put("originalFileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            String origName = file.getOriginalFilename();
            String format = "pdf";
            if (origName != null && origName.contains(".")) {
                format = origName.substring(origName.lastIndexOf('.') + 1).toLowerCase();
            }
            response.put("format", format);
            response.put("fileType", resourceType);

            log.info("File uploaded successfully to folder {}: {}", folder, result.get("public_id"));
            return response;
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw e;
        }
    }
}
