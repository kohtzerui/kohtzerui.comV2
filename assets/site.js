const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
});

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

const filters = document.querySelectorAll('[data-filter]');
const posts = document.querySelectorAll('[data-category][data-date]');
const postGrid = document.querySelector('.post-grid');

if (postGrid && posts.length) {
  const newestFirst = [...posts].sort((a, b) => b.dataset.date.localeCompare(a.dataset.date));
  newestFirst.forEach((post) => {
    post.classList.remove('featured');
    postGrid.append(post);
  });
  newestFirst[0].classList.add('featured');
}

filters.forEach((button) => {
  button.addEventListener('click', () => {
    filters.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    posts.forEach((post) => {
      post.hidden = filter !== 'all' && post.dataset.category !== filter;
    });
  });
});