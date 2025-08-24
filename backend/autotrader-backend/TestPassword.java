import com.autotrader.autotraderbackend.util.PasswordValidator;

public class TestPassword {
    public static void main(String[] args) {
        PasswordValidator validator = new PasswordValidator();
        
        String[] passwords = {"Password", "Password123", "Ali123123"};
        
        for (String password : passwords) {
            PasswordValidator.PasswordValidationResult result = validator.validatePassword(password);
            System.out.println("Password: " + password);
            System.out.println("Valid: " + result.isValid());
            System.out.println("Errors: " + result.getErrors());
            System.out.println("---");
        }
    }
}
