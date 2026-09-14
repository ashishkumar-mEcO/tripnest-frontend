package com.tripnest.tripnest_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OtpService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private static class OtpData {
        String otp;
        LocalDateTime expiresAt;
        boolean verified;

        OtpData(String otp, LocalDateTime expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.verified = false;
        }
    }

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private static final int OTP_EXPIRY_MINUTES = 5;

    public String generateAndSendOtp(String email) {
        String cleanEmail = email.trim().toLowerCase();
        
        // Generate random 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        otpStore.put(cleanEmail, new OtpData(otp, expiry));

        System.out.println("==================================================");
        System.out.println("🔑 REGISTRATION OTP FOR " + cleanEmail + " : " + otp);
        System.out.println("==================================================");

        boolean emailDelivered = false;
        if (mailSender != null) {

            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(cleanEmail);
                message.setSubject("TripNest Registration OTP Verification");
                message.setText("Your TripNest 6-digit registration OTP code is: " + otp + "\n\nThis code is valid for 5 minutes.");
                mailSender.send(message);
                emailDelivered = true;
            } catch (Exception e) {
                System.out.println("Notice: Real SMTP email not sent (requires SMTP credentials). Displaying OTP code in message banner.");
            }
        }

        if (emailDelivered) {
            return "Verification OTP sent to " + cleanEmail + ". Please check your inbox!";
        } else {
            return "Verification OTP Code for " + cleanEmail + ": " + otp;
        }
    }




    public boolean verifyOtp(String email, String inputOtp) {
        String cleanEmail = email.trim().toLowerCase();
        OtpData otpData = otpStore.get(cleanEmail);

        if (otpData == null) {
            throw new RuntimeException("No OTP requested for email: " + cleanEmail);
        }

        if (LocalDateTime.now().isAfter(otpData.expiresAt)) {
            otpStore.remove(cleanEmail);
            throw new RuntimeException("OTP has expired. Please request a new verification code.");
        }

        if (!otpData.otp.equals(inputOtp.trim())) {
            throw new RuntimeException("Invalid OTP code. Please check your email and try again.");
        }

        otpData.verified = true;
        return true;
    }

    public boolean isEmailVerified(String email) {
        String cleanEmail = email.trim().toLowerCase();
        OtpData otpData = otpStore.get(cleanEmail);
        return otpData != null && otpData.verified && !LocalDateTime.now().isAfter(otpData.expiresAt);
    }

    public void clearVerification(String email) {
        otpStore.remove(email.trim().toLowerCase());
    }
}
