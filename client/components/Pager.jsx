import { h } from 'preact';

/**
 * Компонент пейджера без стилизации
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
    <div className="paginator">
      {/* Стрелка "назад" */}
      <span
        onClick={handlePrevClick}
        style={{ cursor: currentPage <= 1 ? 'default' : 'pointer' }}
      >
        &lt;
      </span>

      {/* Кнопки страниц */}
      {pageNumbers.map(page => (
        <span
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            fontWeight: page === currentPage ? 'bold' : 'normal',
            cursor: 'pointer',
            margin: '0 5px'
          }}
        >
          {page}
        </span>
      ))}

      {/* Стрелка "вперед" */}
      <span
        onClick={handleNextClick}
        style={{ cursor: currentPage >= totalPages ? 'default' : 'pointer' }}
      >
        &gt;
      </span>
    </div>
  );
};

export { Pager };