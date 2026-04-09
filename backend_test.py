#!/usr/bin/env python3
"""
Backend API Testing for kryz en app
Tests phone authentication endpoints and existing functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://social-growth-hub-75.preview.emergentagent.com"

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")
    print()

def test_root_endpoint():
    """Test GET /api/ - Root endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "kryz en app" in data["message"]:
                log_test("Root Endpoint", "PASS", f"Response: {data}")
                return True
            else:
                log_test("Root Endpoint", "FAIL", f"Unexpected response: {data}")
                return False
        else:
            log_test("Root Endpoint", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Root Endpoint", "FAIL", f"Exception: {str(e)}")
        return False

def test_check_phone_new():
    """Test POST /api/auth/check-phone for new phone number"""
    try:
        payload = {"phone": "+966555123456"}
        response = requests.post(f"{BACKEND_URL}/api/auth/check-phone", 
                               json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("exists") == False:
                log_test("Check Phone (New)", "PASS", f"Phone not found as expected: {data}")
                return True
            else:
                log_test("Check Phone (New)", "FAIL", f"Expected exists=false, got: {data}")
                return False
        else:
            log_test("Check Phone (New)", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Check Phone (New)", "FAIL", f"Exception: {str(e)}")
        return False

def test_register_user():
    """Test POST /api/auth/register - Register new user"""
    try:
        payload = {"phone": "+966555123456", "name": "أحمد محمد"}
        response = requests.post(f"{BACKEND_URL}/api/auth/register", 
                               json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            if (user.get("phone") == "+966555123456" and 
                user.get("name") == "أحمد محمد" and 
                user.get("gems") == 100 and
                "id" in user):
                log_test("Register User", "PASS", f"User registered successfully: {user}")
                return user["id"]  # Return user ID for later tests
            else:
                log_test("Register User", "FAIL", f"Invalid user data: {data}")
                return None
        else:
            log_test("Register User", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        log_test("Register User", "FAIL", f"Exception: {str(e)}")
        return None

def test_check_phone_existing():
    """Test POST /api/auth/check-phone for existing phone number"""
    try:
        payload = {"phone": "+966555123456"}
        response = requests.post(f"{BACKEND_URL}/api/auth/check-phone", 
                               json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("exists") == True and 
                "user" in data and 
                data["user"].get("phone") == "+966555123456"):
                log_test("Check Phone (Existing)", "PASS", f"Phone found as expected: {data}")
                return True
            else:
                log_test("Check Phone (Existing)", "FAIL", f"Expected exists=true with user data, got: {data}")
                return False
        else:
            log_test("Check Phone (Existing)", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Check Phone (Existing)", "FAIL", f"Exception: {str(e)}")
        return False

def test_login_user():
    """Test POST /api/auth/login - Login existing user"""
    try:
        payload = {"phone": "+966555123456"}
        response = requests.post(f"{BACKEND_URL}/api/auth/login", 
                               json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            if (user.get("phone") == "+966555123456" and 
                user.get("name") == "أحمد محمد" and
                "id" in user):
                log_test("Login User", "PASS", f"User logged in successfully: {user}")
                return True
            else:
                log_test("Login User", "FAIL", f"Invalid login response: {data}")
                return False
        else:
            log_test("Login User", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Login User", "FAIL", f"Exception: {str(e)}")
        return False

def test_register_duplicate():
    """Test POST /api/auth/register with existing phone - should fail"""
    try:
        payload = {"phone": "+966555123456", "name": "مستخدم آخر"}
        response = requests.post(f"{BACKEND_URL}/api/auth/register", 
                               json=payload, timeout=10)
        
        if response.status_code == 400:
            data = response.json()
            if "رقم الهاتف مسجل مسبقاً" in data.get("detail", ""):
                log_test("Register Duplicate", "PASS", f"Duplicate registration blocked as expected: {data}")
                return True
            else:
                log_test("Register Duplicate", "FAIL", f"Wrong error message: {data}")
                return False
        else:
            log_test("Register Duplicate", "FAIL", f"Expected 400 error, got status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Register Duplicate", "FAIL", f"Exception: {str(e)}")
        return False

def test_login_nonexistent():
    """Test POST /api/auth/login with non-existent phone"""
    try:
        payload = {"phone": "+966999999999"}
        response = requests.post(f"{BACKEND_URL}/api/auth/login", 
                               json=payload, timeout=10)
        
        if response.status_code == 404:
            data = response.json()
            if "المستخدم غير موجود" in data.get("detail", ""):
                log_test("Login Non-existent", "PASS", f"Non-existent user login blocked as expected: {data}")
                return True
            else:
                log_test("Login Non-existent", "FAIL", f"Wrong error message: {data}")
                return False
        else:
            log_test("Login Non-existent", "FAIL", f"Expected 404 error, got status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Login Non-existent", "FAIL", f"Exception: {str(e)}")
        return False

def test_get_user(user_id):
    """Test GET /api/user/{user_id}"""
    if not user_id:
        log_test("Get User", "SKIP", "No user ID available from registration")
        return False
        
    try:
        response = requests.get(f"{BACKEND_URL}/api/user/{user_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("phone") == "+966555123456" and 
                data.get("name") == "أحمد محمد" and
                data.get("id") == user_id):
                log_test("Get User", "PASS", f"User data retrieved successfully: {data}")
                return True
            else:
                log_test("Get User", "FAIL", f"Invalid user data: {data}")
                return False
        else:
            log_test("Get User", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("Get User", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("🧪 BACKEND API TESTING - kryz en app")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    results = []
    user_id = None
    
    # Test sequence as specified in review request
    results.append(test_root_endpoint())
    results.append(test_check_phone_new())
    user_id = test_register_user()
    results.append(user_id is not None)
    results.append(test_check_phone_existing())
    results.append(test_login_user())
    results.append(test_register_duplicate())
    results.append(test_login_nonexistent())
    results.append(test_get_user(user_id))
    
    # Summary
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())