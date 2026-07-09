package com.medtech.infrastructure.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.Properties;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Гарантира дека prod Flyway миграциите никогаш не сеат демо податоци.
 *
 * <p>Prod го вчитува само {@code classpath:database}; {@code classpath:database/dev}
 * ги држи mock seed миграциите (V98, V103). Ако seed фајл се премести во
 * {@code database/}, тој ќе се изврши врз продукциска база — креирајќи сметки со
 * објавена лозинка и ресетирајќи ги лозинките на постоечки корисници преку
 * {@code ON CONFLICT (email) DO UPDATE SET password_hash = ...}.
 */
class ProdMigrationsHaveNoSeedDataTest {

    /** Миграциите што prod ги извршува: database/V*__*.sql, без database/dev. */
    private static final String PROD_MIGRATIONS = "classpath*:database/V*__*.sql";

    private static final Pattern BCRYPT_HASH = Pattern.compile("\\$2[aby]\\$");
    private static final Pattern INSERT_USERS = Pattern.compile("(?i)INSERT\\s+INTO\\s+users");
    private static final Pattern SETS_PASSWORD = Pattern.compile("(?i)SET\\s+password_hash");

    private static Resource[] prodMigrations() throws IOException {
        return new PathMatchingResourcePatternResolver().getResources(PROD_MIGRATIONS);
    }

    private static String read(Resource resource) throws IOException {
        try (var in = resource.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    void prodProfileExcludesDevMigrationLocation() throws IOException {
        var yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource("application-prod.yml"));
        Properties props = Objects.requireNonNull(yaml.getObject(), "application-prod.yml не се вчита");

        String locations = props.getProperty("spring.flyway.locations");

        assertThat(locations)
                .as("prod мора експлицитно да ги постави Flyway локациите")
                .isNotBlank();
        assertThat(locations)
                .as("prod не смее да ја вчита database/dev (mock seed)")
                .doesNotContain("database/dev");
    }

    @Test
    void noProdMigrationSeedsCredentials() throws IOException {
        Resource[] migrations = prodMigrations();

        assertThat(migrations)
                .as("не се пронајдени prod миграции — проверката би поминала лажно")
                .isNotEmpty();

        for (Resource migration : migrations) {
            String sql = read(migration);
            String name = migration.getFilename();

            assertThat(BCRYPT_HASH.matcher(sql).find())
                    .as("%s содржи bcrypt hash — seed податоци не смеат во prod", name)
                    .isFalse();
            assertThat(INSERT_USERS.matcher(sql).find())
                    .as("%s внесува корисници — seed податоци не смеат во prod", name)
                    .isFalse();
            assertThat(SETS_PASSWORD.matcher(sql).find())
                    .as("%s презапишува password_hash — би ги отклучил постоечките сметки", name)
                    .isFalse();
        }
    }

    @Test
    void mockSeedLivesOnlyInDevLocation() throws IOException {
        assertThat(new ClassPathResource("database/V98__mock_seed.sql").exists())
                .as("V98 mock seed не смее да стои во prod локацијата")
                .isFalse();
        assertThat(new ClassPathResource("database/dev/V98__mock_seed.sql").exists())
                .as("V98 mock seed треба да остане во database/dev")
                .isTrue();
    }
}
