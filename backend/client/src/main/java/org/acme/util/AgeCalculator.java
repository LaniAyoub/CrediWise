package org.acme.util;

import java.time.LocalDate;
import java.time.Period;

/**
 * Utility class for age-related calculations
 */
public class AgeCalculator {

    public static int calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return 0;
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }

    public static boolean isAgeInRange(LocalDate dateOfBirth, int minAge, int maxAge) {
        int age = calculateAge(dateOfBirth);
        return age >= minAge && age <= maxAge;
    }
}
