package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.AppointmentResponse;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface AppointmentMapper {

    @Mapping(source = "patient.id",                 target = "patientId")
    @Mapping(source = "patient.user",               target = "patientName", qualifiedByName = "fullName")
    @Mapping(source = "doctor.id",                  target = "doctorId")
    @Mapping(source = "doctor",                     target = "doctorName", qualifiedByName = "doctorName")
    @Mapping(source = "doctor.specialization",      target = "doctorSpecialization")
    @Mapping(source = "hospital.id",                target = "hospitalId")
    @Mapping(source = "hospital.name",              target = "hospitalName")
    @Mapping(target = "ratingId",                   ignore = true)
    @Mapping(target = "ratingValue",                ignore = true)
    AppointmentResponse toResponse(Appointment appointment);

    @Named("fullName")
    default String fullName(User user) {
        return user == null ? null : user.fullName();
    }

    @Named("doctorName")
    default String doctorName(Doctor doctor) {
        return doctor == null || doctor.getUser() == null ? null : doctor.getUser().fullName();
    }
}
