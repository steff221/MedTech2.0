package com.medtech.application.service;

import com.medtech.domain.entity.Hospital;
import com.medtech.domain.repository.HospitalRepository;
import com.medtech.domain.vo.HospitalStatus;
import com.medtech.domain.vo.HospitalType;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

import static com.medtech.infrastructure.config.CacheConfig.HOSPITALS_LIST;

/**
 * Read-mostly directory of healthcare facilities. Cached because the data
 * changes rarely but is fetched on nearly every doctor / appointment view.
 *
 * Сервис: бизнис-логика за болниците — креирање, ажурирање и пребарување.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HospitalService {

    private final HospitalRepository hospitalRepository;

    @Cacheable(value = HOSPITALS_LIST, key = "'active'")
    public List<Hospital> findAllActive() {
        return hospitalRepository.findByStatus(HospitalStatus.ACTIVE);
    }

    public Page<Hospital> search(String city, HospitalType type, Pageable pageable) {
        boolean hasCity = StringUtils.hasText(city);
        if (hasCity && type != null) {
            return hospitalRepository.findByCityIgnoreCaseAndType(city, type, pageable);
        }
        if (hasCity) {
            return hospitalRepository.findByCityIgnoreCase(city, pageable);
        }
        return hospitalRepository.findAll(pageable);
    }

    public Hospital getById(Long id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Болница", id));
    }
}
