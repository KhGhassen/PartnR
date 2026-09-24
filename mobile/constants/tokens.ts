// « Le Programme » — the same values as frontend/src/index.css, where every
// pair was contrast-checked against WCAG 2.1. The old coral #E8603A could
// not carry white text (3.41:1) and the old textSub sat at 2.69:1 on cream.
export const T = {
  coral:    '#c2451c',  // accent — white on top: 5.05:1
  coralL:   '#fbeae3',  // accent surface (tints, selected chips)
  coralD:   '#a33814',  // accent as text on a tint or sunken surface
  violet:   '#5b3fd6',  // social: organiser, waitlist, recurrence
  violetL:  '#ece7fb',
  bg:       '#f7f4ee',
  bg2:      '#efebe2',  // sunken surface
  card:     '#ffffff',
  text:     '#1c1a16',
  textMid:  '#565043',
  textSub:  '#6e6656',  // 5.17:1 on bg
  border:   '#e4ded2',
  success:  '#0e6b45',
  successL: '#e7f3ec',
  danger:   '#b3261e',
  dangerL:  '#fbe9e7',
  warn:     '#7a5300',  // also scarcity: "plus que 2 places"
  warnL:    '#f8efdc',
  night:    '#221d18',  // the anchor block, identical in both themes
} as const;
