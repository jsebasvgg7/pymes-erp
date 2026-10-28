package com.rowin.contabilidad.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final EmpresaAccesoInterceptor empresaAccesoInterceptor;

    public WebMvcConfig(EmpresaAccesoInterceptor empresaAccesoInterceptor) {
        this.empresaAccesoInterceptor = empresaAccesoInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(empresaAccesoInterceptor).addPathPatterns("/api/**");
    }
}
