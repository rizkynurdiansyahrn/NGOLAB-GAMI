/**
 * Test Case : TC1_3
 * Fitur     : Login
 * Skenario  : Login Berhasil dengan Data Valid
 * Folder    : Test Cases/Login/TC1_3_Login_Berhasil_Data_Valid
 */

WebUI.openBrowser('http://localhost:5173/')
WebUI.waitForPageLoad(10)

WebUI.setText(
    findTestObject('Object Repository/Page_Login/input_email'),
    'ropaldo@gmail.com'
)
WebUI.setText(
    findTestObject('Object Repository/Page_Login/input_password'),
    'ropaldo'
)
WebUI.click(findTestObject('Object Repository/Page_Login/btn_masuk'))

WebUI.waitForElementPresent(
    findTestObject('Object Repository/Page_Dashboard/div_saldo_poin'),
    10
)
WebUI.verifyElementPresent(
    findTestObject('Object Repository/Page_Dashboard/div_saldo_poin'),
    5
)

WebUI.comment('TC1_3 PASS: Pengguna berhasil masuk ke halaman dashboard')
WebUI.closeBrowser()
