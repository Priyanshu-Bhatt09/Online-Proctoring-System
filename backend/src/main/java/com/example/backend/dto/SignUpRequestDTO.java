package com.example.backend.dto;

public class SignUpRequestDTO {
    private String name;
    private String email;
    private String password;
    public SignUpRequestDTO(String name, String email, String password) {
        this.email = email;
        this.password = password;
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String user) {
        this.name = user;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
