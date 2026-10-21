# Teaching media

Assets for `/teaching/index.html` and the home-page summary card.

## Photos
- `summary.jpg` — home-page card
- `classroom-1.jpg` (students), `presenting-1.jpg` (full room),
  `presenting-2.jpg` (*SEM 2023, ACL, Toronto), `classroom-2.jpg` (poster),
  `classroom-3.jpg` (dissertation defense), `presenting-virtual.jpg` (virtual talk),
  `classroom-4.jpg` (abroad) — the "In the Classroom" gallery

## Video (carousels)
Full lectures (swipeable, one at a time):
- `lecture-intro-to-llms.mp4` (+ `lecture-poster.jpg`) — 224MB → 67MB
- `lecture-signlang-intro.mp4` (+ `lecture-signlang-poster.jpg`) — 365MB → 93MB

Paper presentations (swipeable, two at a time):
- `talk-coherence.mp4`, `talk-signlang.mp4`, `talk-eyegaze.mp4`,
  `talk-sign2sign.mp4`, `talk-signalign.mp4`

## Documents (watermarked PDFs) + cut-out previews
All PDFs are stamped with a diagonal "Mert Inan · merterm.github.io" watermark
(via ghostscript; see `scratchpad/wm4.ps` recipe in notes below). The `excerpt-*.png`
files are cropped page previews shown on the page.
- NLP card: `nlp-homework-1.pdf`, `nlp-midterm.pdf`, `nlp-extra-credit.pdf`,
  `nlp-homework-3.pdf`, `nlp-hw2-sycophancy.ipynb`
- Guest-lecture card: `guest-lecture-svd.pdf` (University of Denver teaching demo)

### Re-watermark a PDF
    cat > wm.ps <<'PS'
    /wm { gsave 0.75 setgray /Helvetica-Bold findfont 18 scalefont setfont
      306 396 translate 55 rotate
      (Mert Inan   merterm.github.io) dup stringwidth pop 2 div neg 0 moveto show
      grestore } def
    << /EndPage { 2 eq { pop false }{ pop wm true } ifelse } >> setpagedevice
    PS
    gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -o out.pdf wm.ps -f in.pdf

### Re-crop a cut-out
    pdftoppm -png -r 150 -f <page> -l <page> file.pdf tmp
    magick tmp-*.png -crop WxH+X+Y +repage -bordercolor '#e4ecea' -border 1 excerpt-x.png

## Size note
This folder is ~228 MB, mostly the two full lectures (67 + 93 MB). Both are under
GitHub's 100 MB hard limit (it warns above 50 MB). To keep the repo light, host the
two lectures on YouTube/Vimeo and swap each `<video>` for an `<iframe>`.
