package com.tripnest.tripnest_backend.controller;
 
import com.tripnest.tripnest_backend.dto.AuthResponse;
import com.tripnest.tripnest_backend.dto.LoginRequest;
import com.tripnest.tripnest_backend.dto.RegisterRequest;
import com.tripnest.tripnest_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
 
    private final UserService userService;
    private final com.tripnest.tripnest_backend.service.OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<java.util.Map<String, String>> sendOtp(@Valid @RequestBody com.tripnest.tripnest_backend.dto.SendOtpRequest request) {
        String msg = otpService.generateAndSendOtp(request.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", msg));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<java.util.Map<String, Object>> verifyOtp(@Valid @RequestBody com.tripnest.tripnest_backend.dto.VerifyOtpRequest request) {
        boolean verified = otpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(java.util.Map.of("message", "OTP verified successfully", "verified", verified));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = userService.registerUser(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

 
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.loginUser(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@Valid @RequestBody com.tripnest.tripnest_backend.dto.GoogleAuthRequest request) {
        AuthResponse response = userService.processGoogleAuth(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

