const album = document.querySelector<HTMLElement>('[data-project-album]');

if (album) {
  const panels = [...album.querySelectorAll<HTMLElement>('[data-album-panel]')];
  const choices = [...album.querySelectorAll<HTMLButtonElement>('[data-album-choice]')];
  const picker = album.querySelector<HTMLElement>('[data-album-picker]');
  const count = album.querySelector<HTMLElement>('[data-album-count]');
  const status = album.querySelector<HTMLElement>('[data-album-status]');
  const total = panels.length;

  // Without JavaScript all projects remain readable as a vertical album.
  if (picker && total > 1 && choices.length === total && choices.every((choice, index) => choice.getAttribute('aria-controls') === panels[index].id)) {
    function select(index: number, announce = true) {
      panels.forEach((panel, position) => { panel.hidden = position !== index; });
      choices.forEach((choice, position) => { choice.setAttribute('aria-pressed', String(position === index)); });
      if (count) count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      if (status && announce) status.textContent = `${panels[index].querySelector('h3')?.textContent?.trim()}, ${total}개 중 ${index + 1}번째 프로젝트`;
    }

    choices.forEach((choice, index) => {
      choice.addEventListener('click', () => select(index));
      choice.addEventListener('keydown', event => {
        let next: number;
        if (event.key === 'ArrowRight') next = (index + 1) % total;
        else if (event.key === 'ArrowLeft') next = (index - 1 + total) % total;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = total - 1;
        else return;
        event.preventDefault();
        select(next);
        choices[next].focus({ preventScroll: true });
      });
    });
    select(0, false);
    picker.hidden = false;
  }
}
