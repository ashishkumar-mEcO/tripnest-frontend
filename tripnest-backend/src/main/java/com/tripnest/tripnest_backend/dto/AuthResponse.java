package com.tripnest.tripnest_backend.dto;
 
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Integer id;
    private String name;
    private String email;
    private String message;
    private String token;
    private String role;

    public AuthResponse(Integer id, String name, String email, String message, String token) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.message = message;
        this.token = token;
    }
}
