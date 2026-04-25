package com.uteru.pos.validation;

import java.util.Locale;

public final class InputSanitizer {
    private InputSanitizer() {
    }

    public static String cleanText(String value) {
        if (value == null) {
            return "";
        }
        return stripControlCharacters(value).trim();
    }

    public static String cleanNullableText(String value) {
        String cleaned = cleanText(value);
        return cleaned.isBlank() ? null : cleaned;
    }

    public static String cleanEmail(String value) {
        String cleaned = cleanNullableText(value);
        return cleaned == null ? null : cleaned.toLowerCase(Locale.ROOT);
    }

    private static String stripControlCharacters(String value) {
        StringBuilder builder = new StringBuilder(value.length());
        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            if (current >= 32 && current != 127) {
                builder.append(current);
            }
        }
        return builder.toString();
    }
}
