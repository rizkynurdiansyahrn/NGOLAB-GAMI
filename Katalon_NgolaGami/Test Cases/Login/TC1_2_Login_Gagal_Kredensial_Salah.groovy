/**
 * Test Case : TC1_2
 * Fitur     : Login
 * Skenario  : Login Gagal dengan Kredensial Salah
 * Folder    : Test Cases/Login/TC1_2_Login_Gagal_Kredensial_Salah
 */

WebUI.openBrowser('http://localhost:5173/')
WebUI.waitForPageLoad(10)

WebUI.setText(
    findTestObject('Object Repository/Page_Login/input_email'),
    'ropaldo@gmail.com'
)
WebUI.setText(
    findTestObject('Object Repository/Page_Login/input_password'),
    'salah123'
)
WebUI.click(findTestObject('Object Repository/Page_Login/btn_masuk'))

WebUI.waitForElementPresent(
    findTestObject('Object Repository/Page_Login/div_errormsg'),
    10
)
WebUI.verifyElementText(
    findTestObject('Object Repository/Page_Login/div_errormsg'),
    'Gagal masuk. Silakan periksa kembali akun Anda.'
)

WebUI.comment('TC1_2 PASS: Pesan error autentikasi muncul sesuai harapan')
WebUI.closeBrowser()
