package com.example.backend.entity;

import jakarta.persistence.*;


@Entity
@Table (name = "users")
public class User {
    @Id //it is a standard way to define a primary key
    @GeneratedValue (strategy = GenerationType.IDENTITY) //this tells how to generate the id this IDENTITY strategy automatically hands over it to the database which translates to an auto-increment coloumn
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    public User(){}

    public User(String name, String password, String email) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
