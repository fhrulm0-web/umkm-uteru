package com.uteru.pos.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NoMarkupValidator implements ConstraintValidator<NoMarkup, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            if (current == '<' || current == '>' || current == 127 || current < 32) {
                return false;
            }
        }
        return true;
    }
}
