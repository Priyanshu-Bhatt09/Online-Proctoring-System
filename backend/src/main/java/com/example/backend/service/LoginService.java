package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.repository.LoginRepo;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    private final LoginRepo repo; //repo - reference variable of type LoginRepo, final means once it is assigned it cannot be changed
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public LoginService(LoginRepo repo) { //this is constructor when spring creates the object of LoginService it will automatically pass the LoginRepo bean into this constructor like - LoginService service = new LoginService(repo)
        this.repo = repo; //this assigns the repo passed in the constructor to the class variable, so that spring can use it everywhere inside the class
    }
    //signup
    public boolean signUp(String name, String email, String password) {
        if(repo.findByEmail(email).isPresent()) {
            return false; //user already exists
        }
        String hashed = encoder.encode(password);
        repo.save(new User(name, email, hashed));
        return true;
    }

    //sign-in
    public boolean signIn(String email, String password) {
        return repo.findByEmail(email) //this method returns an Optional<User>, Optional is basically a container that holds a user obj(if found) or is empty(if no user has that email)
                .map(user -> encoder.matches(password, user.getPassword())) //takes the user obj and transforms it into the boolean if the password matches
                .orElse(false);
    }

    
}
