package com.example.backend.controller;

import com.example.backend.dto.MessageResponseDTO;
import com.example.backend.dto.SignInRequestDTO;
import com.example.backend.dto.SignUpRequestDTO;
import com.example.backend.service.LoginService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/proctor/login")
@CrossOrigin(origins = "http://localhost:3000/")
public class LoginController {
    private final LoginService service;

    public LoginController(LoginService service) {
        this.service = service;
    }
    @PostMapping("/signup")
    public MessageResponseDTO signup(SignUpRequestDTO request) {
        boolean success = service.signUp(
                request.getEmail(),
                request.getPassword(),
                request.getName()
        );
        if(!success) {
            return new MessageResponseDTO("User already exists");
        }
        return new MessageResponseDTO("SignUp Successful");
    }
    @PostMapping("/signin")
    public MessageResponseDTO signIn(SignInRequestDTO request) {
        boolean success = service.signIn(
                request.getEmail(),
                request.getPassword()
        );
        if(!success){
            return new MessageResponseDTO("Invalid Credentials");
        }
        return new MessageResponseDTO("Login successful");
    }
}
