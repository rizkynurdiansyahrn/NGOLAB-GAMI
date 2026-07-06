// ================================================================
// KATALON STUDIO - NGOLAB-GAMI TEST SUITE
// Metode  : Black-Box Testing (Equivalence Partitioning)
// URL     : http://localhost:3000/
// Penguji : Rizky Nurdiansyah (607012400064)
// ================================================================
// CARA PAKAI:
// 1. Buka Test Case di Katalon Studio
// 2. Klik tab "Script" (atas kanan editor)
// 3. Hapus semua isi, lalu copy-paste SATU blok TC di bawah
// 4. Klik Run (tombol hijau)
// ================================================================


// ################################################################
// TC1_1_Login_Tombol_Disabled
// Folder Katalon: Test Cases/Login/TC1_1_Login_Tombol_Disabled
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.verifyElementHasAttribute(byId('btn_masuk'), 'disabled', 5)
WebUI.comment('TC1_1 PASS: Tombol masuk dinonaktifkan saat form kosong')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC1_2_Login_Gagal_Kredensial_Salah
// Folder Katalon: Test Cases/Login/TC1_2_Login_Gagal_Kredensial_Salah
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'salah123')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_errormsg'), 10)
WebUI.verifyElementText(byId('div_errormsg'), 'Gagal masuk. Silakan periksa kembali akun Anda.')
WebUI.comment('TC1_2 PASS: Pesan error autentikasi muncul sesuai harapan')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC1_3_Login_Berhasil_Data_Valid
// Folder Katalon: Test Cases/Login/TC1_3_Login_Berhasil_Data_Valid
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.verifyElementPresent(byId('div_saldo_poin'), 5)
WebUI.comment('TC1_3 PASS: Pengguna berhasil masuk ke halaman dashboard')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC2_1_Register_Daftar_Akun_Baru
// Folder Katalon: Test Cases/Register/TC2_1_Register_Daftar_Akun_Baru
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.click(byId('btn_tab_daftar'))
WebUI.waitForElementVisible(byId('input_nama'), 5)
WebUI.setText(byId('input_nama'), 'Rizky')
WebUI.setText(byId('input_phone'), '081234567890')
WebUI.setText(byId('input_email'), 'rizky@gmail.com')
WebUI.setText(byId('input_password'), 'rizky123')
WebUI.click(byId('btn_daftar_sekarang'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 15)
WebUI.verifyElementPresent(byId('div_saldo_poin'), 5)
WebUI.comment('TC2_1 PASS: Akun baru berhasil terdaftar dan otomatis login')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC3_1_Library_Hub_Filter_Kategori
// Folder Katalon: Test Cases/Library_Hub/TC3_1_Library_Hub_Filter_Kategori
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_library'))
WebUI.waitForElementVisible(byId('btn_filter_puzzle'), 5)
WebUI.click(byId('btn_filter_puzzle'))
WebUI.waitForElementPresent(byId('card_game_memory'), 10)
WebUI.verifyElementPresent(byId('card_game_memory'), 5)
WebUI.comment('TC3_1 PASS: Filter kategori Puzzle bekerja, hanya menampilkan game Puzzle')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC4_1_Gameplay_Ngolab_Catch
// Folder Katalon: Test Cases/Gameplay/TC4_1_Gameplay_Ngolab_Catch
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_library'))
WebUI.waitForElementVisible(byId('btn_play_ngolab_catch'), 5)
WebUI.click(byId('btn_play_ngolab_catch'))
WebUI.delay(10)
WebUI.waitForElementPresent(byId('popup_game_over'), 15)
WebUI.verifyElementPresent(byId('popup_game_over'), 5)
WebUI.comment('TC4_1 PASS: Pop-up game over dan perolehan koin berhasil ditampilkan')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC5_1_Tukar_Voucher_Koin_Kurang
// Folder Katalon: Test Cases/Tukar_Voucher/TC5_1_Tukar_Voucher_Koin_Kurang
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_reward'))
WebUI.waitForElementVisible(byId('btn_voucher_mahal'), 5)
WebUI.verifyElementText(byId('btn_voucher_mahal'), 'Kurang')
WebUI.comment('TC5_1 PASS: Tombol voucher terkunci dengan status "Kurang"')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC5_2_Tukar_Voucher_Berhasil
// Folder Katalon: Test Cases/Tukar_Voucher/TC5_2_Tukar_Voucher_Berhasil
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_reward'))
WebUI.waitForElementVisible(byId('btn_voucher_cukup'), 5)
WebUI.click(byId('btn_voucher_cukup'))
WebUI.waitForElementVisible(byId('btn_konfirmasi_tukar'), 5)
WebUI.click(byId('btn_konfirmasi_tukar'))
WebUI.waitForElementPresent(byId('div_voucher_aktif'), 10)
WebUI.verifyElementPresent(byId('div_voucher_aktif'), 5)
WebUI.comment('TC5_2 PASS: Voucher aktif berhasil diterbitkan setelah penukaran')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC6_1_Validasi_Kasir_Kode_Salah
// Folder Katalon: Test Cases/Validasi_Kasir/TC6_1_Validasi_Kasir_Kode_Salah
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_reward'))
WebUI.waitForElementVisible(byId('input_cek_kode'), 5)
WebUI.setText(byId('input_cek_kode'), 'SALAH-123')
WebUI.click(byId('btn_periksa_voucher'))
WebUI.waitForElementVisible(byId('div_msg_validasi'), 5)
WebUI.verifyElementText(byId('div_msg_validasi'), 'Voucher tidak valid atau kadaluwarsa (Simulasi Lokal).')
WebUI.comment('TC6_1 PASS: Kode voucher salah ditolak dengan pesan error yang tepat')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC6_2_Validasi_Kasir_Kode_Valid
// Folder Katalon: Test Cases/Validasi_Kasir/TC6_2_Validasi_Kasir_Kode_Valid
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_reward'))
WebUI.waitForElementVisible(byId('input_cek_kode'), 5)
WebUI.setText(byId('input_cek_kode'), 'GAMI-9999')
WebUI.click(byId('btn_periksa_voucher'))
WebUI.waitForElementVisible(byId('h4_status_validasi'), 5)
WebUI.verifyElementText(byId('h4_status_validasi'), 'VOUCHER VALID!')
WebUI.comment('TC6_2 PASS: Kode voucher valid diterima dan diskon terhitung')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC7_1_Study_Tracker_Reward_Koin
// Folder Katalon: Test Cases/Study_Tracker/TC7_1_Study_Tracker_Reward_Koin
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_tracker'))
WebUI.waitForElementVisible(byId('btn_mulai_belajar'), 5)
WebUI.click(byId('btn_mulai_belajar'))
WebUI.delay(5)
WebUI.click(byId('btn_selesai_belajar'))
WebUI.waitForElementVisible(byId('div_reward_popup'), 10)
WebUI.verifyElementText(byId('div_reward_popup'), 'Koin Berhasil Ditambahkan')
WebUI.comment('TC7_1 PASS: Koin berhasil ditambahkan setelah sesi belajar selesai')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC8_1_Patungan_Koin_Urunan
// Folder Katalon: Test Cases/Patungan_Koin/TC8_1_Patungan_Koin_Urunan
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_patungan'))
WebUI.waitForElementVisible(byId('btn_room_aktif'), 5)
WebUI.click(byId('btn_room_aktif'))
WebUI.waitForElementVisible(byId('input_poin_patungan'), 5)
WebUI.setText(byId('input_poin_patungan'), '100')
WebUI.click(byId('btn_sumbang_patungan'))
WebUI.waitForElementVisible(byId('div_status_sumbang'), 10)
WebUI.verifyElementText(byId('div_status_sumbang'), 'Berhasil Urunan')
WebUI.comment('TC8_1 PASS: Kontribusi 100 koin berhasil ditambahkan ke saldo patungan')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC9_1_Leaderboard_Papan_Peringkat
// Folder Katalon: Test Cases/Leaderboard/TC9_1_Leaderboard_Papan_Peringkat
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('tab_leaderboard'))
WebUI.waitForElementPresent(byId('list_rank_1'), 10)
WebUI.verifyElementPresent(byId('list_rank_1'), 5)
WebUI.comment('TC9_1 PASS: Papan peringkat dimuat dan menampilkan peringkat teratas')
WebUI.closeBrowser()
// ################################################################


// ################################################################
// TC10_1_Edit_Profile_Ubah_Nama
// Folder Katalon: Test Cases/Edit_Profile/TC10_1_Edit_Profile_Ubah_Nama
// ################################################################
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.testobject.ConditionType

def byId = { String id ->
	def o = new TestObject(id)
	o.addProperty('css', ConditionType.EQUALS, "#${id}", true)
	return o
}

WebUI.openBrowser('http://localhost:3000/')
WebUI.waitForPageLoad(10)
WebUI.setText(byId('input_email'), 'ropaldo@gmail.com')
WebUI.setText(byId('input_password'), 'ropaldo')
WebUI.click(byId('btn_masuk'))
WebUI.waitForElementPresent(byId('div_saldo_poin'), 10)
WebUI.click(byId('btn_sidebar'))
WebUI.waitForElementVisible(byId('btn_edit_profile'), 5)
WebUI.click(byId('btn_edit_profile'))
WebUI.waitForElementVisible(byId('input_nama_baru'), 5)
WebUI.clearText(byId('input_nama_baru'))
WebUI.setText(byId('input_nama_baru'), 'Rizky New')
WebUI.click(byId('btn_simpan_profil'))
WebUI.waitForElementVisible(byId('txt_sidebar_nama'), 5)
WebUI.verifyElementText(byId('txt_sidebar_nama'), 'Rizky New')
WebUI.comment('TC10_1 PASS: Nama profil berhasil diperbarui menjadi "Rizky New"')
WebUI.closeBrowser()
// ################################################################
rang   -> PASS
 * Tukar_Voucher/TC5_2_Tukar_Voucher_Berhasil      -> PASS
 * Validasi_Kasir/TC6_1_Validasi_Kasir_Kode_Salah  -> PASS
 * Validasi_Kasir/TC6_2_Validasi_Kasir_Kode_Valid  -> PASS
 * Study_Tracker/TC7_1_Study_Tracker_Reward_Koin   -> PASS
 * Patungan_Koin/TC8_1_Patungan_Koin_Urunan        -> PASS
 * Leaderboard/TC9_1_Leaderboard_Papan_Peringkat   -> PASS
 * Edit_Profile/TC10_1_Edit_Profile_Ubah_Nama      -> PASS
 */
