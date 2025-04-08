import { h } from 'preact';

/**
 * Компонент пейджера со стилями Bootstrap
 *
 * @param {Object} props Свойства компонента
 * @param {number} props.currentPage Текущая страница
 * @param {number} props.total Общее количество элементов
 * @param {number} props.pageSize Количество элементов на странице (по умолчанию 10)
 * @param {number} props.visiblePages Количество видимых страниц (по умолчанию 5)
 * @param {Function} props.onPageChange Функция-обработчик изменения страницы
 * @param {number} props.step Размер шага для кнопок "вперед" и "назад" (по умолчанию 1)
 * @returns {JSX.Element}
 */
const Pager = ({
                 currentPage,
                 total,
                 pageSize = 10,
                 visiblePages = 5,
                 onPageChange,
                 step = 1
               }) => {
  // Вычисляем общее количество страниц внутри компонента
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Функция для генерации массива страниц, которые нужно отобразить
  const getPageNumbers = () => {
    // Ограничим видимые страницы общим количеством страниц
    const actualVisiblePages = Math.min(visiblePages, totalPages);

    // Определяем начальную и конечную страницы для отображения
    let startPage = Math.max(1, currentPage - Math.floor(actualVisiblePages / 2));
    let endPage = startPage + actualVisiblePages - 1;

    // Корректируем в случае выхода за пределы
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - actualVisiblePages + 1);
    }

    // Создаем массив страниц
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Обработчик клика по стрелке "назад"
  const handlePrevClick = () => {
    if (currentPage > 1) {
      onPageChange(Math.max(1, currentPage - step));
    }
  };

  // Обработчик клика по стрелке "вперед"
  const handleNextClick = () => {
    if (currentPage < totalPages) {
      onPageChange(Math.min(totalPages, currentPage + step));
    }
  };

  const pageNumbers = getPageNumbers();

  // Не отображаем пейджер, если всего одна страница
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Навигация по страницам">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
          <a
            className="page-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePrevClick();
            }}
            aria-label="Предыдущая"
          >
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>

        {pageNumbers.map(page => (
          <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
            <a
              className="page-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page);
              }}
            >
              {page}
            </a>
          </li>
        ))}

        <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
          <a
            className="page-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNextClick();
            }}
            aria-label="Следующая"
          >
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};

export { Pager };