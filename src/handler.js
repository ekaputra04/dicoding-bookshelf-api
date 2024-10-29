const { nanoid } = require("nanoid");
const books = require("./books");

// Fungsi helper untuk menghasilkan response
const createResponse = (h, status, message = null, data = null, code = 400) => {
  const response = h.response({
    status,
    ...(message && { message }),
    ...(data && { data }),
  });
  response.code(code);
  return response;
};

// Fungsi validasi untuk input yang kosong atau tidak valid
const validateInput = (payload, isEdit = false) => {
  const requiredFields = {
    name: "nama",
    year: "tahun",
    author: "penulis",
    summary: "ringkasan",
    publisher: "penerbit",
    pageCount: "pageCount",
    readPage: "readPage",
    reading: "reading",
  };

  const errors = Object.entries(requiredFields).reduce((acc, [key, label]) => {
    if (!isEdit && payload[key] === undefined) {
      acc.push(`Mohon isi ${label} buku`);
    }
    return acc;
  }, []);

  if (
    payload.readPage !== undefined &&
    payload.pageCount !== undefined &&
    payload.readPage > payload.pageCount
  ) {
    errors.push("readPage tidak boleh lebih besar dari pageCount");
  }

  return errors;
};

// Handler untuk menambah buku
const addBookHandler = (request, h) => {
  const payload = request.payload;
  const errors = validateInput(payload);

  if (errors.length > 0) {
    return createResponse(
      h,
      "fail",
      `Gagal menambahkan buku. ${errors.join(", ")}`
    );
  }

  const id = nanoid(16);
  const timestamp = new Date().toISOString();
  const finished = payload.pageCount === payload.readPage;

  const newBook = {
    id,
    ...payload,
    finished,
    insertedAt: timestamp,
    updatedAt: timestamp,
  };

  books.push(newBook);

  return createResponse(
    h,
    "success",
    "Buku berhasil ditambahkan",
    { bookId: id },
    201
  );
};

// Handler untuk mendapatkan semua buku
const getAllBooksHandler = (request, h) => {
  const { name, reading, finished } = request.query;

  let filteredBooks = books;

  if (name) {
    filteredBooks = filteredBooks.filter((book) =>
      book.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (reading !== undefined) {
    const isReading = reading === "1";
    filteredBooks = filteredBooks.filter((book) => book.reading === isReading);
  }

  if (finished !== undefined) {
    const isFinished = finished === "1";
    filteredBooks = filteredBooks.filter(
      (book) => book.finished === isFinished
    );
  }

  const minimalBooks = filteredBooks.map(({ id, name, publisher }) => ({
    id,
    name,
    publisher,
  }));

  return createResponse(h, "success", null, { books: minimalBooks }, 200);
};

// Handler untuk mendapatkan buku berdasarkan ID
const getBookByIdHandler = (request, h) => {
  const { id } = request.params;
  const book = books.find((n) => n.id === id);

  if (book) {
    return createResponse(h, "success", null, { book }, 200);
  }

  return createResponse(h, "fail", "Buku tidak ditemukan", null, 404);
};

// Handler untuk memperbarui buku berdasarkan ID
const editBookByIdHandler = (request, h) => {
  const { id } = request.params;
  const payload = request.payload;
  const index = books.findIndex((book) => book.id === id);

  if (index === -1) {
    return createResponse(
      h,
      "fail",
      "Gagal memperbarui buku. Id tidak ditemukan",
      null,
      404
    );
  }

  const errors = validateInput(payload);
  if (errors.length > 0) {
    return createResponse(
      h,
      "fail",
      `Gagal memperbarui buku. ${errors.join(", ")}`,
      null,
      400
    );
  }

  if (payload.readPage > payload.pageCount) {
    return createResponse(
      h,
      "fail",
      "Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount",
      null,
      400
    );
  }

  const updatedAt = new Date().toISOString();
  const finished = payload.pageCount === payload.readPage;

  books[index] = {
    ...books[index],
    ...payload,
    finished,
    updatedAt,
  };

  return createResponse(h, "success", "Buku berhasil diperbarui", null, 200);
};

// Handler untuk menghapus buku berdasarkan ID
const deleteBookByIdHandler = (request, h) => {
  const { id } = request.params;
  const index = books.findIndex((note) => note.id === id);

  if (index !== -1) {
    books.splice(index, 1);
    return createResponse(h, "success", "Buku berhasil dihapus", null, 200);
  }

  return createResponse(
    h,
    "fail",
    "Buku gagal dihapus. Id tidak ditemukan",
    null,
    404
  );
};

module.exports = {
  addBookHandler,
  getAllBooksHandler,
  getBookByIdHandler,
  editBookByIdHandler,
  deleteBookByIdHandler,
};
