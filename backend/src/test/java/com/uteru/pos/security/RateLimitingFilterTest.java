package com.uteru.pos.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RateLimitingFilterTest {

    @Test
    void appliesAuthenticationLimitOnlyToLoginEndpoint() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(1, Duration.ofMinutes(15), 100, Duration.ofMinutes(15));

        MockHttpServletResponse firstLogin = execute(filter, "POST", "/api/auth/login");
        MockHttpServletResponse secondLogin = execute(filter, "POST", "/api/auth/login");
        MockHttpServletResponse profilesAfterLoginLimit = execute(filter, "GET", "/api/auth/profiles");

        assertEquals(200, firstLogin.getStatus());
        assertEquals(429, secondLogin.getStatus());
        assertEquals(200, profilesAfterLoginLimit.getStatus());
    }

    @Test
    void profileRequestsDoNotConsumeLoginAttemptLimit() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(1, Duration.ofMinutes(15), 100, Duration.ofMinutes(15));

        MockHttpServletResponse firstProfiles = execute(filter, "GET", "/api/auth/profiles");
        MockHttpServletResponse secondProfiles = execute(filter, "GET", "/api/auth/profiles");
        MockHttpServletResponse loginAfterProfiles = execute(filter, "POST", "/api/auth/login");

        assertEquals(200, firstProfiles.getStatus());
        assertEquals(200, secondProfiles.getStatus());
        assertEquals(200, loginAfterProfiles.getStatus());
    }

    private MockHttpServletResponse execute(RateLimitingFilter filter, String method, String uri) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr("192.168.1.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        return response;
    }
}
