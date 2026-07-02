package com.medtech.infrastructure.exception;

import com.medtech.constant.ErrorCode;
import org.springframework.http.HttpStatus;

/**
 * Исклучок: фрлен кога бараниот ресурс не е најден (404).
 */
public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, message);
    }

    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException(resource + " not found: " + id);
    }
}
