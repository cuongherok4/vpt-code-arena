package com.vpt.arena;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class VptArenaApplication {

	public static void main(String[] args) {
		SpringApplication.run(VptArenaApplication.class, args);
	}

}
