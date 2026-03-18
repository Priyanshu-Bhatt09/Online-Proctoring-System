package com.example.backend.dto;

public class SignInRequestDTO {
    private String email;
    private String password;
    public SignInRequestDTO(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }
}
