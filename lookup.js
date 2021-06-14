(function () {
  const languages = [
    {
      code: 'en',
      label: 'English',
      default: true,
    },
    {
      code: 'fr',
      label: 'Français',
    }
  ];

  // Create container elements to receive Wiktionary contents
  const container = document.createElement('div');
  container.id = 'wiktionary-lookup-container';
  document.body.appendChild(container);

  container.innerHTML = `
    <div class="tabs"></div>
    <div class="definition"><div class="spacer"></div></div>
  `;

  const definition = container.getElementsByClassName('definition')[0];
  const tabs = container.getElementsByClassName('tabs')[0];

  languages.forEach((lang) => {
    const tab = document.createElement('div');
    tab.append(lang.label);
    tabs.appendChild(tab);
    lang.tab = tab;

    const def = document.createElement('div');
    definition.appendChild(def);
    def.style.display = 'none';
    lang.definition = def;
  });

  languages.forEach((lang) => {
    lang.tab.addEventListener('click', (event) => {
      languages.map((l) => l.tab.classList.remove('selected'));
      languages.map((l) => l.definition.style.display = 'none');

      lang.tab.classList.add('selected');
      lang.definition.style.display = 'block';
    });
  })

  // Create marker element to position container
  const markerId = "sel_" + new Date().getTime() + "_" + Math.random().toString().substr(2);
  const markerEl = document.createElement("span");
  markerEl.id = markerId;
  markerEl.appendChild(document.createTextNode("\ufeff"));

  window.addEventListener('mousedown', (event) => {
    if (!container.contains(event.target)) {
      container.style.visibility = 'hidden';
      languages.map((l) => l.definition.style.display = 'none');
      languages.find(lang => lang.default === true).definition.style.display = 'block';
    }
  });

  window.addEventListener('mouseup', () => {
    languages.forEach((lang) => {
      const base = `https://${lang.code}.wiktionary.org`;

      const sel = window.getSelection();
      const text = sel.toString();

      if (text !== '') {
        const request = new Request(`${base}/w/api.php?action=parse&format=json&page=${text}`);
        fetch(request)
          .then(response => {
            if (response.status === 200) {
              return response.json();
            } else {
              throw new Error('Something went wrong on api server!');
            }
          })
          .then(response => {
            // Select default language tab
            languages.map((l) => l.tab.classList.remove('selected'));
            languages.map((l) => l.definition.style.display = 'none');
            languages.find(lang => lang.default === true).tab.classList.add('selected');
            languages.find(lang => lang.default === true).definition.style.display = 'block';

            if (response && response.parse && response.parse.text && response.parse.text['*']) {
              let content = response.parse.text['*'];

              // Rewrite links
              content = content.replaceAll('href="/wiki/', `href="${base}/wiki/`);
              content = content.replaceAll('href=', 'target="_blank" href=');

              // Set container content
              lang.definition.innerHTML = content;

              // Place marker after selection
              range = sel.getRangeAt(0).cloneRange();
              range.collapse(false);
              range.insertNode(markerEl);

              // Find markerEl position http://www.quirksmode.org/js/findpos.html
              var obj = markerEl;
              var left = 0, top = 0;
              do {
                left += obj.offsetLeft;
                top += obj.offsetTop;
              } while (obj = obj.offsetParent);

              // Cleanup
              markerEl.parentNode.removeChild(markerEl);

              // Show container
              container.style.visibility = 'visible';
              if (left < document.body.getBoundingClientRect().width / 2) {
                container.style.left = `${left - sel.getRangeAt(0).getClientRects()[0].width}px`;
              }
              else {
                  container.style.left = `${left - container.getBoundingClientRect().width}px`;
                }
                container.style.top = `${top + markerEl.offsetHeight + 20}px`;
                definition.scrollTo(0, 0);
              }

              lang.definition.focus();
            }).catch(error => {
              console.error(error);
            });
      }
    });
  });
}) ();
