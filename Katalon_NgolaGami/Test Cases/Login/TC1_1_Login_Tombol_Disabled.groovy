/**
 * Test Case : TC1_1
 * Fitur     : Login
 * Skenario  : Tombol Masuk Dinonaktifkan Saat Form Kosong
 * Folder    : Test Cases/Login/TC1_1_Login_Tombol_Disabled
 */

WebUI.openBrowser('http://localhost:5173/')
WebUI.waitForPageLoad(10)

// Verifikasi tombol masuk dinonaktifkan saat form kosong
WebUI.verifyElementHasAttribute(
    findTestObject('Object Repository/Page_Login/btn_masuk'),
    'disabled',
    5
)

WebUI.comment('TC1_1 PASS: Tombol masuk dinonaktifkan saat form kosong')
WebUI.closeBrowser()
