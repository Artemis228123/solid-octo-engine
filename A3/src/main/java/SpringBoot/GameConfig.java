package SpringBoot;

import Controller.GameController;
import Model.Game;
import View.ConsoleGameView;
import View.GameView;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class GameConfig implements WebMvcConfigurer {

    @Bean
    public Game game() {
        Game game = new Game();
        game.initialize();
        return game;
    }

    @Bean
    public GameView gameView() {
        return new ConsoleGameView();
    }

    @Bean
    public GameController gameController(Game game, GameView view) {
        return new GameController(game, view);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:8080")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
