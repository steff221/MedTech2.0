package com.medtech.infrastructure.exception;

import com.medtech.constant.ErrorCode;
import org.springframework.http.HttpStatus;

/**
 * Исклучок: фрлен при неуспешна валидација на влезни податоци (400).
 */
public class ValidationException extends AppException {

    public ValidationException(String message) {
        super(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    public ValidationException(String errorCode, String message) {
        super(errorCode, HttpStatus.BAD_REQUEST, message);
    }
}
