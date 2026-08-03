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
      post.hidden = filter !== 'all' && !post.dataset.category.split('|').includes(filter);
    });
  });
});
document.querySelectorAll('[data-duck-like]').forEach((button) => {
  const root = button.closest('.duck-like');
  const status = root?.querySelector('[data-duck-like-status]');
  const count = root?.querySelector('[data-duck-like-count]');
  const countLabel = root?.querySelector('[data-duck-like-count-label]');
  const endpoint = `/api/likes?article=${encodeURIComponent(window.location.pathname)}`;

  const setLiked = (liked) => {
    button.setAttribute('aria-pressed', String(liked));
    button.setAttribute('aria-label', liked ? 'You liked this article' : 'Like this article');
  };

  const setCount = (value) => {
    if (!Number.isInteger(value) || value < 0) return;
    if (count) count.textContent = String(value);
    if (countLabel) countLabel.textContent = value === 1 ? 'like' : 'likes';
  };

  const loadState = async () => {
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Like counter unavailable.');

      const data = await response.json();
      setCount(data.count);
      setLiked(data.liked === true);
    } catch {
      if (status) status.textContent = 'The like counter is currently unavailable.';
    }
  };

  setLiked(false);
  loadState();

  button.addEventListener('click', async () => {
    if (button.getAttribute('aria-pressed') === 'true' || button.getAttribute('aria-busy') === 'true') {
      return;
    }

    button.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'Recording your like.';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Like could not be recorded.');

      const data = await response.json();
      setCount(data.count);
      setLiked(data.liked === true);
      if (status) {
        status.textContent = data.accepted === false
          ? 'You already liked this article during this session.'
          : 'Thanks for the like!';
      }
    } catch {
      if (status) status.textContent = 'Your like could not be recorded. Please try again.';
    } finally {
      button.removeAttribute('aria-busy');
    }
  });
});
