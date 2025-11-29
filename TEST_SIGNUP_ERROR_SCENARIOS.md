# Test Scenarios for Sign-Up Error Handling

## How to Test the Fixes

### Scenario 1: Password Mismatch
**Steps:**
1. Go to Sign Up page (Regular User)
2. Fill in all fields:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password456" (different)
3. Check the "I agree to terms" checkbox
4. Click "Create Account"

**Expected Result:**
- ❌ Toast notification: "Passwords don't match! Please make sure both passwords are the same."
- ❌ Red inline text below confirm password field: "Passwords do not match"
- Form submission is blocked

**Visual Feedback While Typing:**
- While typing different passwords, you should see: "Passwords do not match" in red
- When passwords match, you should see: "✓ Passwords match" in green

---

### Scenario 2: Duplicate Email
**Steps:**
1. First, create an account with email: "test@example.com"
2. Log out
3. Try to create another account with the same email: "test@example.com"
4. Fill in all other required fields correctly
5. Make sure passwords match
6. Click "Create Account"

**Expected Result:**
- ❌ Toast notification: "This email is already registered. Please use a different email or try signing in."
- Form submission fails gracefully
- User can correct the email and try again

---

### Scenario 3: Weak Password (Too Short)
**Steps:**
1. Go to Sign Up page
2. Fill in:
   - Full Name: "Test User"
   - Email: "newuser@example.com"
   - Password: "123" (less than 8 characters)
   - Confirm Password: "123"
3. Try to submit

**Expected Result:**
- ⚠️ Yellow warning text below password field: "Password must be at least 8 characters"
- ❌ Toast notification: "Password must be at least 8 characters long"
- Form submission is blocked

---

### Scenario 4: Invalid Email Format
**Steps:**
1. Go to Sign Up page
2. Fill in:
   - Full Name: "Test User"
   - Email: "notanemail" (no @ or domain)
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Create Account"

**Expected Result:**
- ❌ Toast notification: "Please enter a valid email address"
- Form submission is blocked

---

### Scenario 5: Missing Required Fields
**Steps:**
1. Go to Sign Up page
2. Leave Full Name empty
3. Fill in email and passwords
4. Click "Create Account"

**Expected Result:**
- ❌ Toast notification: "Please enter your full name"
- Form submission is blocked

---

### Scenario 6: Terms Not Agreed
**Steps:**
1. Go to Sign Up page
2. Fill in all fields correctly
3. Leave "I agree to terms" checkbox UNCHECKED
4. Click "Create Account"

**Expected Result:**
- ❌ Toast notification: "Please agree to the terms and conditions"
- Form submission is blocked

---

### Scenario 7: Successful Registration
**Steps:**
1. Go to Sign Up page
2. Fill in:
   - Full Name: "New User"
   - Email: "newuser123@example.com" (unique email)
   - Password: "securepassword123"
   - Confirm Password: "securepassword123" (matching)
3. Check "I agree to terms"
4. Click "Create Account"

**Expected Result:**
- ✅ Toast notification: "Account created successfully! Welcome to One 2 One Love!"
- User is redirected to Profile page
- User is logged in

**Visual Feedback While Typing:**
- Green checkmark: "✓ Passwords match" when passwords match

---

## Visual Indicators

### Real-Time Feedback (Before Submission)

#### Password Field
- When password is less than 8 characters:
  ```
  Password: [******]
  ⚠️ Password must be at least 8 characters
  ```

#### Confirm Password Field
- When passwords don't match:
  ```
  Confirm Password: [*******]
  ❌ Passwords do not match
  ```

- When passwords match:
  ```
  Confirm Password: [*******]
  ✓ Passwords match
  ```

### Toast Notifications
All error messages now appear as toast notifications at the top/bottom of the screen:
- Red background for errors
- Green background for success
- Automatically dismiss after a few seconds
- Can be manually dismissed by clicking

---

## Additional Test Cases

### For Therapist/Influencer/Professional Sign-Up Forms:
These forms also have improved error handling for:
- Email already exists
- Invalid credentials
- Server errors
- Network errors

Test by:
1. Going to respective sign-up pages
2. Trying to submit with existing email
3. Checking that error messages are displayed clearly

---

## Browser Testing

Test in multiple browsers to ensure compatibility:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

---

## Accessibility Testing

- Error messages should be readable by screen readers
- Color indicators should not be the only way to show errors (we use text + color)
- Keyboard navigation should work properly
- Focus should remain on the error field

---

## Notes

- All toast notifications use the Sonner library
- Inline validation messages appear in real-time
- Server-side errors are properly caught and displayed
- Console logs are maintained for debugging

