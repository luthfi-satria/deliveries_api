export default {
  general: {
    success: {
      code: 'SUCCESS',
      message: 'Sukses',
    },
    fail: {
      code: 'FAIL',
      message: 'Gagal',
    },
    empty_token: 'Kode Token tidak ada.',
    invalid_token: 'Kode Token tidak valid.',
    dataNotFound: {
      code: 'DATA_NOT_FOUND',
      message: 'Data tidak ditemukan.',
    },
    emailExist: {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Email sudah digunakan.',
    },
    emailNotFound: {
      code: 'EMAIL_NOT_FOUND',
      message: 'Email tidak ditemukan.',
    },
    empty_photo: {
      code: 'IMAGE_NOT_FOUND',
      message: 'File image kosong.',
    },
    idNotFound: {
      code: 'ID_NOT_FOUND',
      message: 'ID tidak ditemukan.',
    },
    invalidID: {
      code: 'INVALID_ID',
      message: 'ID tidak valid.',
    },
    invalidUUID: {
      code: 'INVALID_UUID',
      message: 'UUID tidak valid.',
    },
    invalidValue: {
      code: 'INVALID_VALUE',
      message: 'Value tidak sesuai.',
    },
    nameExist: {
      code: 'NAME_ALREADY_EXISTS',
      message: 'Nama sudah digunakan.',
    },
    phoneExist: {
      code: 'PHONE_ALREADY_EXISTS',
      message: 'Nomor Telepon sudah digunakan.',
    },
    phoneNotFound: {
      code: 'PHONE_NOT_FOUND',
      message: 'Nomer telepon tidak ditemukan.',
    },
    storeIdNotMatch: {
      code: 'STORE_ID_NOT_MATCH',
      message: 'Store ID bukan milik merchant.',
    },
    unauthorizedUser: {
      code: 'USER_UNAUTHORIZED',
      message: 'User tidak mendapatkan akses.',
    },
    unverificatedUser: {
      code: 'USER_NOT_VERIFIED',
      message: 'User belum terverifikasi.',
    },
    unverifiedEmail: {
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Email belum terverifikasi.',
    },
    unverifiedPhone: {
      code: 'PHONE_NOT_VERIFIED',
      message: 'Nomer telepon belum terverifikasi.',
    },
  },
  getAllCouriers: {
    success: {
      code: 'COURIER_LIST_SUCCESS',
      message: 'Sukses mengambil data couriers.',
    },
    fail: {
      code: 'COURIER_LIST_FAIL',
      message: 'Gagal mengambil data couriers.',
    },
    courierNotFound: {
      code: 'COURIER_ID_NOT_FOUND',
      message: 'Courier id tidak dapat ditemukan.',
    },
  },
  fetchCouriers: {
    success: {
      code: 'COURIER_FETCH_SUCCESS',
      message: 'Sukses mengupdate couriers dari provider.',
    },
    fail: {
      code: 'COURIER_FETCH_FAIL',
      message: 'Gagal mengupdate couriers dari provider.',
    },
  },
  updateCourier: {
    success: {
      code: 'COURIER_UPDATE_SUCCESS',
      message: 'Update courier berhasil.',
    },
    fail: {
      code: 'COURIER_UPDATE_FAIL',
      message: 'Update courier gagal.',
    },
  },
};
