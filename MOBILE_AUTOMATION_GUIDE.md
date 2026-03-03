# Mobile Automation Guide

## Overview
This guide covers mobile automation testing setup and execution for the Viva application.

---

## Table of Contents
1. [Mobile Automation Frameworks](#mobile-automation-frameworks)
2. [Setup Requirements](#setup-requirements)
3. [Android Automation](#android-automation)
4. [iOS Automation](#ios-automation)
5. [WeChat Mini Program Testing](#wechat-mini-program-testing)
6. [Running Mobile Tests](#running-mobile-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Mobile Automation Frameworks

### Recommended Tools
- **Appium** - Cross-platform mobile automation
- **Detox** - React Native testing framework
- **Maestro** - Simple mobile UI testing
- **WebdriverIO** - Mobile + Web automation

### Current Stack (Recommended)
```
Framework: Appium
Language: TypeScript
Test Runner: Playwright/Mocha
CI/CD: Azure DevOps
```

---

## Setup Requirements

### 1. Install Dependencies

#### macOS Setup
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Java (required for Appium)
brew install openjdk@11

# Install Appium
npm install -g appium

# Install Appium Doctor (diagnostic tool)
npm install -g appium-doctor

# Install Appium drivers
appium driver install uiautomator2  # For Android
appium driver install xcuitest       # For iOS
```

#### Windows Setup
```powershell
# Install Node.js from https://nodejs.org
# Install Java JDK from https://www.oracle.com/java/technologies/downloads/

# Install Appium
npm install -g appium

# Install Appium Doctor
npm install -g appium-doctor

# Install Appium drivers
appium driver install uiautomator2
```

### 2. Android Setup

#### Install Android Studio
1. Download from https://developer.android.com/studio
2. Install Android SDK
3. Set environment variables:

```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### Create Android Emulator
```bash
# List available system images
sdkmanager --list

# Install system image
sdkmanager "system-images;android-33;google_apis;arm64-v8a"

# Create AVD (Android Virtual Device)
avdmanager create avd -n TestDevice -k "system-images;android-33;google_apis;arm64-v8a"

# Start emulator
emulator -avd TestDevice
```

### 3. iOS Setup (macOS only)

#### Install Xcode
```bash
# Install Xcode from App Store
# Install Xcode Command Line Tools
xcode-select --install

# Install iOS simulators
xcrun simctl list devices
```

#### Install Additional Tools
```bash
# Install Carthage (dependency manager)
brew install carthage

# Install ios-deploy (for real devices)
npm install -g ios-deploy

# Install authorize-ios (for WebDriverAgent)
npm install -g authorize-ios
```

---

## Android Automation

### Project Structure
```
mobile-automation/
├── tests/
│   ├── android/
│   │   ├── login.test.ts
│   │   ├── navigation.test.ts
│   │   └── forms.test.ts
│   └── ios/
│       ├── login.test.ts
│       └── navigation.test.ts
├── config/
│   ├── android.config.ts
│   └── ios.config.ts
├── helpers/
│   ├── appium.helper.ts
│   └── device.helper.ts
└── package.json
```

### Android Configuration
```typescript
// config/android.config.ts
export const androidConfig = {
  platformName: 'Android',
  'appium:deviceName': 'TestDevice',
  'appium:platformVersion': '13',
  'appium:app': '/path/to/app.apk',
  'appium:automationName': 'UiAutomator2',
  'appium:newCommandTimeout': 300,
  'appium:noReset': false,
  'appium:fullReset': false
};
```

### Sample Android Test
```typescript
// tests/android/login.test.ts
import { remote } from 'webdriverio';
import { androidConfig } from '../../config/android.config';

describe('Android Login Tests', () => {
  let driver: any;

  before(async () => {
    driver = await remote({
      protocol: 'http',
      hostname: 'localhost',
      port: 4723,
      path: '/',
      capabilities: androidConfig
    });
  });

  after(async () => {
    await driver.deleteSession();
  });

  it('should login successfully', async () => {
    const emailInput = await driver.$('~email-input');
    await emailInput.setValue('test@example.com');

    const passwordInput = await driver.$('~password-input');
    await passwordInput.setValue('password123');

    const loginButton = await driver.$('~login-button');
    await loginButton.click();

    const welcomeText = await driver.$('~welcome-message');
    await expect(welcomeText).toBeDisplayed();
  });
});
```

---

## iOS Automation

### iOS Configuration
```typescript
// config/ios.config.ts
export const iosConfig = {
  platformName: 'iOS',
  'appium:deviceName': 'iPhone 15',
  'appium:platformVersion': '17.0',
  'appium:app': '/path/to/app.app',
  'appium:automationName': 'XCUITest',
  'appium:newCommandTimeout': 300,
  'appium:noReset': false
};
```

### Sample iOS Test
```typescript
// tests/ios/login.test.ts
import { remote } from 'webdriverio';
import { iosConfig } from '../../config/ios.config';

describe('iOS Login Tests', () => {
  let driver: any;

  before(async () => {
    driver = await remote({
      protocol: 'http',
      hostname: 'localhost',
      port: 4723,
      path: '/',
      capabilities: iosConfig
    });
  });

  after(async () => {
    await driver.deleteSession();
  });

  it('should login successfully', async () => {
    const emailInput = await driver.$('~email-input');
    await emailInput.setValue('test@example.com');

    const passwordInput = await driver.$('~password-input');
    await passwordInput.setValue('password123');

    const loginButton = await driver.$('~login-button');
    await loginButton.click();

    const welcomeText = await driver.$('~welcome-message');
    await expect(welcomeText).toBeDisplayed();
  });
});
```

---

## WeChat Mini Program Testing

### Overview
WeChat Mini Programs require special automation tools because they run inside the WeChat app ecosystem. Traditional mobile automation tools like Appium have limitations with Mini Programs.

### Recommended Tools for WeChat Mini Programs

#### 1. **WeChat DevTools (官方开发者工具)**
- Official WeChat development tool
- Built-in automation testing capabilities
- Supports headless testing
- Best for CI/CD integration

#### 2. **Minium (微信小程序自动化测试框架)**
- Official WeChat automation framework
- Python-based
- Integrates with WeChat DevTools
- Supports real device testing

#### 3. **Appium with WeChat**
- Can automate WeChat app interaction
- Limited access to Mini Program internals
- Good for black-box testing

---

### Setup WeChat Mini Program Testing

#### Prerequisites
```bash
# Install Node.js
brew install node  # macOS
# or download from https://nodejs.org

# Install Python (for Minium)
brew install python@3.11

# Install WeChat DevTools
# Download from: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
```

#### Install Minium Framework
```bash
# Create virtual environment
python3 -m venv wechat-automation
source wechat-automation/bin/activate  # macOS/Linux
# or
wechat-automation\Scripts\activate  # Windows

# Install Minium
pip install minium

# Verify installation
minium --version
```

#### Configure WeChat DevTools
1. Open WeChat DevTools
2. Go to Settings → Security
3. Enable "Service Port" (default: 9420)
4. Enable "Auto Mode" for automation

---

### Project Structure for WeChat Testing

```
wechat-automation/
├── tests/
│   ├── test_login.py
│   ├── test_navigation.py
│   ├── test_forms.py
│   └── test_payment.py
├── config/
│   ├── wechat_config.py
│   └── test_data.json
├── pages/
│   ├── base_page.py
│   ├── login_page.py
│   └── home_page.py
├── utils/
│   ├── logger.py
│   └── screenshot.py
├── reports/
├── requirements.txt
└── run_tests.py
```

---

### Configuration Setup

#### 1. Create `config/wechat_config.py`
```python
# config/wechat_config.py

import os

class WeChatConfig:
    # WeChat DevTools settings
    DEVTOOLS_PATH = "/Applications/wechatwebdevtools.app"  # macOS
    # DEVTOOLS_PATH = "C:\\Program Files (x86)\\Tencent\\微信web开发者工具"  # Windows
    
    # Mini Program settings
    MINI_PROGRAM_PATH = "/path/to/your/miniprogram/project"
    APP_ID = "your_appid_here"
    
    # Test settings
    TIMEOUT = 30
    IMPLICIT_WAIT = 10
    SCREENSHOT_DIR = "reports/screenshots"
    
    # WeChat DevTools port
    PORT = 9420
    
    # Test environment
    BASE_URL = "https://your-miniprogram-backend.com"
    TEST_USER = "test@example.com"
    TEST_PASSWORD = "password123"
```

#### 2. Create `requirements.txt`
```txt
minium>=1.0.8
pytest>=7.4.0
pytest-html>=3.2.0
Pillow>=10.0.0
requests>=2.31.0
```

---

### Page Object Model for WeChat Mini Programs

#### Base Page
```python
# pages/base_page.py

from minium import WXMinium

class BasePage:
    def __init__(self, mini: WXMinium):
        self.mini = mini
        self.page = None
    
    def navigate_to(self, path: str):
        """Navigate to specific page"""
        self.mini.redirect_to(path)
        self.page = self.mini.current_page
        return self
    
    def wait_for_element(self, selector: str, timeout: int = 10):
        """Wait for element to appear"""
        return self.page.wait_for(selector, timeout=timeout)
    
    def click_element(self, selector: str):
        """Click element by selector"""
        element = self.page.get_element(selector)
        element.tap()
    
    def input_text(self, selector: str, text: str):
        """Input text into element"""
        element = self.page.get_element(selector)
        element.input(text)
    
    def get_text(self, selector: str):
        """Get text from element"""
        element = self.page.get_element(selector)
        return element.inner_text
    
    def take_screenshot(self, name: str):
        """Take screenshot"""
        self.page.screenshot(f"reports/screenshots/{name}.png")
```

#### Login Page
```python
# pages/login_page.py

from pages.base_page import BasePage

class LoginPage(BasePage):
    # Selectors
    EMAIL_INPUT = "input.email-input"
    PASSWORD_INPUT = "input.password-input"
    LOGIN_BUTTON = "button.login-btn"
    ERROR_MESSAGE = "view.error-msg"
    
    def login(self, email: str, password: str):
        """Perform login"""
        self.navigate_to("/pages/login/login")
        self.wait_for_element(self.EMAIL_INPUT)
        
        self.input_text(self.EMAIL_INPUT, email)
        self.input_text(self.PASSWORD_INPUT, password)
        self.click_element(self.LOGIN_BUTTON)
        
        return self
    
    def is_error_displayed(self):
        """Check if error message is displayed"""
        try:
            element = self.page.get_element(self.ERROR_MESSAGE)
            return element.is_exist()
        except:
            return False
    
    def get_error_message(self):
        """Get error message text"""
        return self.get_text(self.ERROR_MESSAGE)
```

---

### Sample Test Cases

#### Basic Test with Minium
```python
# tests/test_login.py

import pytest
import minium
from config.wechat_config import WeChatConfig
from pages.login_page import LoginPage

class TestLogin:
    
    @pytest.fixture(scope="class")
    def mini(self):
        """Setup Mini Program"""
        config = {
            "project_path": WeChatConfig.MINI_PROGRAM_PATH,
            "dev_tool_path": WeChatConfig.DEVTOOLS_PATH,
            "port": WeChatConfig.PORT,
            "enable_app_log": True,
        }
        
        mini = minium.Minium(config)
        yield mini
        mini.shutdown()
    
    def test_successful_login(self, mini):
        """Test successful login flow"""
        login_page = LoginPage(mini)
        login_page.login(
            email=WeChatConfig.TEST_USER,
            password=WeChatConfig.TEST_PASSWORD
        )
        
        # Wait for navigation to home page
        home_page = mini.current_page
        assert "/pages/home/home" in home_page.path
        
        # Take screenshot
        login_page.take_screenshot("successful_login")
    
    def test_invalid_credentials(self, mini):
        """Test login with invalid credentials"""
        login_page = LoginPage(mini)
        login_page.login(
            email="invalid@example.com",
            password="wrongpassword"
        )
        
        # Verify error message
        assert login_page.is_error_displayed()
        error_msg = login_page.get_error_message()
        assert "Invalid credentials" in error_msg
    
    def test_empty_fields(self, mini):
        """Test login with empty fields"""
        login_page = LoginPage(mini)
        login_page.navigate_to("/pages/login/login")
        login_page.click_element(LoginPage.LOGIN_BUTTON)
        
        # Verify validation message
        assert login_page.is_error_displayed()
```

#### Advanced Test - Navigation
```python
# tests/test_navigation.py

import pytest
import minium
from config.wechat_config import WeChatConfig

class TestNavigation:
    
    @pytest.fixture(scope="class")
    def mini(self):
        config = {
            "project_path": WeChatConfig.MINI_PROGRAM_PATH,
            "dev_tool_path": WeChatConfig.DEVTOOLS_PATH,
            "port": WeChatConfig.PORT,
        }
        mini = minium.Minium(config)
        yield mini
        mini.shutdown()
    
    def test_tab_navigation(self, mini):
        """Test bottom tab navigation"""
        # Navigate to home
        mini.redirect_to("/pages/home/home")
        assert "/pages/home/home" in mini.current_page.path
        
        # Click on profile tab
        page = mini.current_page
        profile_tab = page.get_element(".tab-bar .profile-tab")
        profile_tab.tap()
        
        # Verify navigation
        assert "/pages/profile/profile" in mini.current_page.path
    
    def test_back_navigation(self, mini):
        """Test back navigation"""
        # Navigate to details page
        mini.navigate_to("/pages/details/details")
        
        # Click back button
        page = mini.current_page
        back_btn = page.get_element(".nav-back")
        back_btn.tap()
        
        # Verify returned to previous page
        assert "/pages/home/home" in mini.current_page.path
```

#### Form Testing
```python
# tests/test_forms.py

import pytest
import minium
from config.wechat_config import WeChatConfig

class TestForms:
    
    @pytest.fixture(scope="class")
    def mini(self):
        config = {
            "project_path": WeChatConfig.MINI_PROGRAM_PATH,
            "dev_tool_path": WeChatConfig.DEVTOOLS_PATH,
            "port": WeChatConfig.PORT,
        }
        mini = minium.Minium(config)
        yield mini
        mini.shutdown()
    
    def test_fill_survey_form(self, mini):
        """Test filling out survey form"""
        mini.redirect_to("/pages/survey/survey")
        page = mini.current_page
        
        # Fill text input
        name_input = page.get_element("input.name-input")
        name_input.input("John Doe")
        
        # Select radio button
        radio = page.get_element("radio[value='option1']")
        radio.tap()
        
        # Select checkbox
        checkbox = page.get_element("checkbox[value='agree']")
        checkbox.tap()
        
        # Select from picker
        picker = page.get_element("picker.date-picker")
        picker.tap()
        confirm_btn = page.get_element("button.picker-confirm")
        confirm_btn.tap()
        
        # Submit form
        submit_btn = page.get_element("button.submit-btn")
        submit_btn.tap()
        
        # Verify success message
        success_msg = page.get_element("view.success-message")
        assert success_msg.is_exist()
```

---

### Running WeChat Mini Program Tests

#### Run Single Test
```bash
# Activate virtual environment
source wechat-automation/bin/activate

# Run specific test
pytest tests/test_login.py::TestLogin::test_successful_login -v

# Run with HTML report
pytest tests/test_login.py --html=reports/report.html --self-contained-html
```

#### Run All Tests
```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=pages --cov-report=html

# Run in parallel
pytest tests/ -n 4
```

#### Create Test Runner Script
```python
# run_tests.py

import sys
import pytest
from datetime import datetime

def main():
    """Run WeChat Mini Program tests"""
    
    # Generate report filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = f"reports/test_report_{timestamp}.html"
    
    # Pytest arguments
    args = [
        "tests/",
        "-v",
        "--html=" + report_file,
        "--self-contained-html",
        "--tb=short",
        "-x",  # Stop on first failure
    ]
    
    # Run tests
    exit_code = pytest.main(args)
    
    print(f"\n{'='*60}")
    print(f"Test report generated: {report_file}")
    print(f"{'='*60}\n")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
```

---

### Alternative: Appium with WeChat

If you prefer using Appium to automate WeChat app:

```python
# appium_wechat_test.py

from appium import webdriver
from appium.options.android import UiAutomator2Options

# Setup
options = UiAutomator2Options()
options.platform_name = "Android"
options.device_name = "TestDevice"
options.app_package = "com.tencent.mm"  # WeChat package
options.app_activity = ".ui.LauncherUI"
options.no_reset = True

driver = webdriver.Remote(
    "http://localhost:4723",
    options=options
)

try:
    # Wait for WeChat to load
    driver.implicitly_wait(10)
    
    # Find and click "Discover" tab
    discover_tab = driver.find_element("xpath", "//android.widget.TextView[@text='Discover']")
    discover_tab.click()
    
    # Click "Mini Programs"
    mini_programs = driver.find_element("xpath", "//android.widget.TextView[@text='Mini Programs']")
    mini_programs.click()
    
    # Search for your mini program
    search_box = driver.find_element("id", "com.tencent.mm:id/search_box")
    search_box.send_keys("Your Mini Program Name")
    
    # Click on your mini program
    your_app = driver.find_element("xpath", f"//android.widget.TextView[@text='Your Mini Program Name']")
    your_app.click()
    
    # Now interact with mini program elements
    # Note: Element inspection is limited in mini programs
    
except Exception as e:
    print(f"Error: {e}")
finally:
    driver.quit()
```

---

### CI/CD Integration for WeChat Mini Programs

#### Azure Pipeline Configuration
```yaml
# azure-pipelines-wechat.yml

trigger:
  branches:
    include:
    - master
  paths:
    include:
    - wechat-automation/**

schedules:
- cron: "0 22 * * 1-5"  # 6 AM Malaysia Time (Mon-Fri)
  displayName: WeChat Mini Program Test Run
  branches:
    include:
    - master
  always: true

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: wechat-test-secrets
  - name: PYTHON_VERSION
    value: '3.11'

stages:
- stage: WeChatTests
  displayName: 'WeChat Mini Program Tests'
  jobs:
  - job: MiniumTests
    displayName: 'Run Minium Tests'
    steps:
    - task: UsePythonVersion@0
      displayName: 'Install Python'
      inputs:
        versionSpec: '$(PYTHON_VERSION)'
        addToPath: true

    - script: |
        # Install WeChat DevTools (headless)
        wget https://dldir1.qq.com/WechatWebDev/release/linux/nwjs_0.80.0_linux-x64.tar.gz
        tar -xzf nwjs_0.80.0_linux-x64.tar.gz
        export DEVTOOLS_PATH=$(pwd)/nwjs
      displayName: 'Install WeChat DevTools'

    - script: |
        python -m pip install --upgrade pip
        pip install -r wechat-automation/requirements.txt
      displayName: 'Install Python Dependencies'

    - script: |
        cd wechat-automation
        pytest tests/ -v \
          --html=reports/test_report.html \
          --self-contained-html \
          --junitxml=reports/test_results.xml
      displayName: 'Run WeChat Tests'
      env:
        MINI_PROGRAM_PATH: $(MINI_PROGRAM_PATH)
        APP_ID: $(APP_ID)
        TEST_USER: $(TEST_USER)
        TEST_PASSWORD: $(TEST_PASSWORD)
      continueOnError: true

    - task: PublishTestResults@2
      displayName: 'Publish Test Results'
      condition: always()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '**/test_results.xml'
        failTaskOnFailedTests: false

    - task: PublishPipelineArtifact@1
      displayName: 'Upload Test Report'
      condition: always()
      inputs:
        targetPath: 'wechat-automation/reports'
        artifact: 'wechat-test-reports'
        publishLocation: 'pipeline'

    - script: |
        # Send email notification (optional)
        python wechat-automation/scripts/send_email_report.py
      displayName: 'Send Email Report'
      condition: always()
      env:
        EMAIL_USER: $(EMAIL_USER)
        EMAIL_PASSWORD: $(EMAIL_PASSWORD)
        EMAIL_RECIPIENTS: $(EMAIL_RECIPIENTS)
      continueOnError: true
```

---

### WeChat Mini Program Specific Tips

#### 1. Element Selectors
```python
# CSS Selectors (preferred)
page.get_element("view.container")
page.get_element("button#submit-btn")
page.get_element("input[name='email']")

# Class name
page.get_element(".user-info")

# Tag name
page.get_element("button")

# Multiple elements
elements = page.get_elements("view.item")
```

#### 2. Wait Strategies
```python
# Wait for element
page.wait_for("view.loading", exists=False, timeout=10)

# Wait for navigation
mini.wait_for_page_ready("/pages/home/home")

# Custom wait
import time
def wait_for_condition(condition_func, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        if condition_func():
            return True
        time.sleep(0.5)
    return False
```

#### 3. Handle WeChat APIs
```python
# Mock wx.request
mini.mock_wx_method(
    "request",
    result={
        "statusCode": 200,
        "data": {"success": True}
    }
)

# Mock getUserInfo
mini.mock_wx_method(
    "getUserInfo",
    result={
        "userInfo": {
            "nickName": "Test User",
            "avatarUrl": "https://example.com/avatar.png"
        }
    }
)
```

#### 4. Network Interception
```python
# Intercept network requests
def request_handler(request):
    print(f"Request: {request.url}")
    return request

mini.enable_network_panel()
mini.add_request_listener(request_handler)
```

---

## Running Mobile Tests

### Start Appium Server
```bash
# Start Appium with logging
appium --log-level debug

# Or start in background
appium &
```

### Run Tests Locally

#### Android
```bash
# Start Android emulator first
emulator -avd TestDevice

# Run tests
npm run test:android

# Or specific test
npm run test:android -- tests/android/login.test.ts
```

#### iOS
```bash
# List available simulators
xcrun simctl list devices

# Boot simulator
xcrun simctl boot "iPhone 15"

# Run tests
npm run test:ios

# Or specific test
npm run test:ios -- tests/ios/login.test.ts
```

### Package.json Scripts
```json
{
  "scripts": {
    "test:android": "mocha tests/android/**/*.test.ts",
    "test:ios": "mocha tests/ios/**/*.test.ts",
    "test:mobile": "npm run test:android && npm run test:ios",
    "appium": "appium",
    "emulator": "emulator -avd TestDevice"
  }
}
```

---

## CI/CD Integration

### Azure Pipeline for Mobile Tests

Create `azure-pipelines-mobile.yml`:

```yaml
# Azure Pipeline for Mobile Automation Tests

trigger:
  branches:
    include:
    - master
  paths:
    include:
    - mobile-automation/**

schedules:
- cron: "0 22 * * 1-5"  # 6 AM Malaysia Time (Mon-Fri)
  displayName: Mobile Test Run (6 AM MYT, Mon-Fri)
  branches:
    include:
    - master
  always: true

pool:
  vmImage: 'macOS-latest'  # Required for iOS testing

variables:
  - group: mobile-test-secrets

stages:
- stage: AndroidTests
  displayName: 'Android Mobile Tests'
  jobs:
  - job: AndroidAutomation
    displayName: 'Run Android Tests'
    steps:
    - task: NodeTool@0
      displayName: 'Install Node.js'
      inputs:
        versionSpec: '18.x'

    - script: |
        npm install -g appium
        appium driver install uiautomator2
      displayName: 'Install Appium'

    - script: |
        cd mobile-automation
        npm install
      displayName: 'Install Dependencies'

    - script: |
        echo "y" | $ANDROID_HOME/tools/bin/sdkmanager --install "system-images;android-30;google_apis;x86"
        echo "no" | $ANDROID_HOME/tools/bin/avdmanager create avd -n test_device -k "system-images;android-30;google_apis;x86" --force
      displayName: 'Create Android Emulator'

    - script: |
        $ANDROID_HOME/emulator/emulator -avd test_device -no-audio -no-window &
        $ANDROID_HOME/platform-tools/adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed | tr -d '\r') ]]; do sleep 1; done; input keyevent 82'
      displayName: 'Start Emulator'

    - script: |
        appium &
        sleep 5
      displayName: 'Start Appium Server'

    - script: |
        cd mobile-automation
        npm run test:android
      displayName: 'Run Android Tests'
      continueOnError: true

    - task: PublishTestResults@2
      displayName: 'Publish Test Results'
      condition: always()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '**/test-results.xml'

- stage: iOSTests
  displayName: 'iOS Mobile Tests'
  dependsOn: []  # Run in parallel with Android
  jobs:
  - job: iOSAutomation
    displayName: 'Run iOS Tests'
    steps:
    - task: NodeTool@0
      displayName: 'Install Node.js'
      inputs:
        versionSpec: '18.x'

    - script: |
        npm install -g appium
        appium driver install xcuitest
      displayName: 'Install Appium'

    - script: |
        cd mobile-automation
        npm install
      displayName: 'Install Dependencies'

    - script: |
        xcrun simctl boot "iPhone 15" || true
      displayName: 'Boot iOS Simulator'

    - script: |
        appium &
        sleep 5
      displayName: 'Start Appium Server'

    - script: |
        cd mobile-automation
        npm run test:ios
      displayName: 'Run iOS Tests'
      continueOnError: true

    - task: PublishTestResults@2
      displayName: 'Publish Test Results'
      condition: always()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '**/test-results.xml'
```

---

## Best Practices

### 1. Element Locators
```typescript
// ✅ Good: Use accessibility IDs
await driver.$('~login-button').click();

// ✅ Good: Use resource IDs (Android)
await driver.$('android=new UiSelector().resourceId("com.app:id/login")').click();

// ✅ Good: Use accessibility identifiers (iOS)
await driver.$('~loginButton').click();

// ❌ Bad: Use XPath (fragile)
await driver.$('//android.widget.Button[@text="Login"]').click();
```

### 2. Waits
```typescript
// ✅ Good: Explicit waits
await driver.waitUntil(
  async () => (await driver.$('~welcome-message')).isDisplayed(),
  {
    timeout: 10000,
    timeoutMsg: 'Welcome message not displayed'
  }
);

// ❌ Bad: Hard-coded sleeps
await driver.pause(5000);
```

### 3. Test Independence
```typescript
// ✅ Good: Reset app state
afterEach(async () => {
  await driver.reset();
});

// ✅ Good: Clear data before test
beforeEach(async () => {
  await driver.execute('mobile: clearApp', { appId: 'com.vivacity.app' });
});
```

### 4. Page Object Model
```typescript
// helpers/LoginPage.ts
export class LoginPage {
  constructor(private driver: any) {}

  get emailInput() {
    return this.driver.$('~email-input');
  }

  get passwordInput() {
    return this.driver.$('~password-input');
  }

  get loginButton() {
    return this.driver.$('~login-button');
  }

  async login(email: string, password: string) {
    await this.emailInput.setValue(email);
    await this.passwordInput.setValue(password);
    await this.loginButton.click();
  }
}

// tests/login.test.ts
import { LoginPage } from '../helpers/LoginPage';

it('should login', async () => {
  const loginPage = new LoginPage(driver);
  await loginPage.login('test@example.com', 'password123');
});
```

---

## Troubleshooting

### Common Issues

#### 1. Appium Server Not Starting
```bash
# Check if port 4723 is in use
lsof -i :4723

# Kill process if needed
kill -9 <PID>

# Start Appium with different port
appium --port 4724
```

#### 2. Android Emulator Issues
```bash
# List running emulators
adb devices

# Restart ADB
adb kill-server
adb start-server

# Check emulator status
emulator -list-avds
```

#### 3. iOS Simulator Issues
```bash
# List simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15"

# Reset simulator
xcrun simctl erase "iPhone 15"

# Shutdown all simulators
xcrun simctl shutdown all
```

#### 4. WebDriverAgent Issues (iOS)
```bash
# Rebuild WebDriverAgent
cd /path/to/appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent
mkdir -p Resources/WebDriverAgent.bundle
./Scripts/bootstrap.sh -d
```

### Debug Tips

#### Enable Appium Logging
```bash
appium --log-level debug --log appium.log
```

#### Check Appium Doctor
```bash
appium-doctor --android
appium-doctor --ios
```

#### Screenshot on Failure
```typescript
afterEach(async function() {
  if (this.currentTest?.state === 'failed') {
    const screenshot = await driver.takeScreenshot();
    // Save screenshot
  }
});
```

---

## Resources

### Documentation
- [Appium Official Docs](https://appium.io/docs/en/latest/)
- [WebdriverIO Mobile Testing](https://webdriver.io/docs/appium/)
- [Android Testing](https://developer.android.com/training/testing)
- [iOS Testing](https://developer.apple.com/documentation/xctest)

### Tools
- [Appium Desktop](https://github.com/appium/appium-desktop) - GUI inspector
- [Appium Doctor](https://github.com/appium/appium-doctor) - Diagnostic tool
- [Android Studio](https://developer.android.com/studio) - Android development
- [Xcode](https://developer.apple.com/xcode/) - iOS development

---

## Next Steps

1. **Setup Mobile Testing Environment**
   - Install Appium and dependencies
   - Configure Android/iOS emulators
   - Verify setup with `appium-doctor`

2. **Create Mobile Test Project**
   - Initialize project structure
   - Add configuration files
   - Write first test

3. **Integrate with CI/CD**
   - Add mobile pipeline to Azure DevOps
   - Configure scheduled runs
   - Set up notifications

4. **Expand Test Coverage**
   - Add more test scenarios
   - Implement Page Object Model
   - Add screenshot/video recording

---

**Created:** March 2, 2026  
**Last Updated:** March 2, 2026  
**Maintained By:** QA Automation Team
