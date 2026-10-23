import { choice } from "./builders.ts";
type Row = [domain: string, prompt: string, answer: string, wrong: string[], explanation: string];
const A="Algebra", M="Advanced Math", D="Problem-Solving and Data Analysis", G="Geometry and Trigonometry";
const first: Row[] = [
  [A,"If 4x + 7 = 39, what is x?","8",["6","7","9"],"4x = 32, so x = 8."],
  [A,"A line passes through (1, 5) and (4, 14). What is its slope?","3",["2","4","9"],"Slope = (14 − 5)/(4 − 1) = 9/3 = 3."],
  [A,"If x + y = 11 and x − y = 3, what is y?","4",["3","5","7"],"Adding gives 2x = 14, so x = 7 and y = 4."],
  [A,"A taxi charges a fixed $6 plus $2.50 per kilometre. A journey costs $26. How many kilometres long is the journey?","8",["6","10","12"],"6 + 2.5d = 26, so d = 20/2.5 = 8."],
  [A,"Which inequality is equivalent to −2x + 5 > 13?","x < −4",["x > −4","x < 4","x > 4"],"−2x > 8. Dividing by a negative reverses the inequality, giving x < −4."],
  [A,"The equation y = 5x + 12 models the cost y of x items. What does 12 represent?","The fixed cost when no items are purchased",["The cost per item","The maximum number of items","The number of items sold"],"At x = 0, y = 12, so it is the fixed initial cost."],
  [A,"How many solutions does 3(x + 2) = 3x + 6 have?","Infinitely many",["None","Exactly one","Exactly two"],"Both sides simplify to 3x + 6, so every real x satisfies the equation."],
  [A,"A line parallel to y = −3x + 8 passes through (2, 1). What is its y-intercept?","7",["−7","−5","5"],"The slope is −3. Substituting gives 1 = −3(2) + b, hence b = 7."],
  [M,"Which expression is equivalent to x² + 8x + 16?","(x + 4)²",["(x + 8)²","(x − 4)²","x(x + 16)"],"The perfect square (x + 4)² expands to x² + 8x + 16."],
  [M,"What is the greater solution of x² − 9x + 20 = 0?","5",["2","4","9"],"(x − 4)(x − 5) = 0 gives 4 and 5; the greater is 5."],
  [M,"A culture starts with 300 cells and doubles every hour. How many cells are present after 3 hours?","2400",["900","1200","1800"],"300 × 2³ = 2400."],
  [M,"For x ≠ 3, (x² − 9)/(x − 3) equals which expression?","x + 3",["x − 3","x² + 3","1"],"Factor x² − 9 = (x − 3)(x + 3) and cancel the nonzero factor."],
  [M,"If √(2x + 1) = 5, what is x?","12",["10","13","24"],"2x + 1 = 25, so x = 12. Substitution confirms the nonnegative square root is 5."],
  [M,"What is the minimum value of f(x) = (x + 2)² + 7?","7",["−2","2","9"],"A square is at least zero, attained at x = −2, so the minimum is 7."],
  [M,"If a > 0, which expression equals a^(1/2) × a^(3/2)?","a²",["a","a³","a^(3/4)"],"Add exponents for the same positive base: 1/2 + 3/2 = 2."],
  [D,"A jacket's price falls from $120 to $90. What is the percentage decrease?","25%",["20%","30%","33.3%"],"The decrease is 30 out of the original 120: 30/120 = 0.25."],
  [D,"The mean of five values is 18. A sixth value of 30 is added. What is the new mean?","20",["19","21","24"],"The original sum is 90. New sum 120 divided by 6 gives 20."],
  [D,"A bag has 4 green, 3 blue and 5 white counters. What is the probability of drawing a blue counter at random? Give a fraction or decimal.","1/4",["1/3","3/5","3/8"],"Three of twelve counters are blue: 3/12 = 1/4 = 0.25."],
  [D,"A survey randomly samples students from the entire school register. What is the principal advantage over surveying only members of a sports club?","It reduces selection bias in estimating school-wide opinions",["It guarantees every estimate is exact","It removes all variation in answers","It ensures all students answer identically"],"The full register includes students outside the club and supports a less selective sample."],
  [G,"A circle has diameter 10. What is its area?","25π",["10π","50π","100π"],"Radius is 5, so area πr² = 25π."],
  [G,"A right triangle has hypotenuse 13 and one leg 5. What is the length of the other leg?","12",["8","10","18"],"The other leg is √(13² − 5²) = √144 = 12."],
  [G,"Two similar triangles have corresponding side lengths in the ratio 2:5. What is the ratio of their areas, smaller to larger?","4:25",["2:5","4:10","8:125"],"Area scales as the square of the side scale: 2²:5² = 4:25."],
];
const lower: Row[] = [
  [A,"If 6x − 8 = 28, what is x?","6",["4","5","7"],"6x = 36, so x = 6."],
  [A,"Which equation represents a line with slope 4 and y-intercept −7?","y = 4x − 7",["y = −7x + 4","y = 7x − 4","y = −4x − 7"],"In y = mx + b, m is the slope and b the y-intercept."],
  [A,"If x + y = 9 and y = 2, what is x?","7",["5","9","11"],"Substitute y = 2 to obtain x + 2 = 9, so x = 7."],
  [A,"Three identical notebooks and a $4 pen cost $19. What is the price in dollars of one notebook?","5",["3","4","6"],"3n + 4 = 19, so 3n = 15 and n = 5."],
  [A,"Which inequality is equivalent to x + 8 ≤ 15?","x ≤ 7",["x ≥ 7","x ≤ 23","x ≥ 23"],"Subtract 8 from both sides."],
  [A,"A tank initially contains 50 litres and loses 3 litres each minute. Which expression gives the amount remaining after t minutes, before it is empty?","50 − 3t",["50 + 3t","3 − 50t","150t"],"Start at 50 and subtract 3 for each elapsed minute."],
  [A,"How many solutions does 5x + 1 = 5x + 9 have?","None",["One","Two","Infinitely many"],"Subtracting 5x gives the false equation 1 = 9."],
  [A,"A line through (0, 2) and (3, 8) has what slope?","2",["1","3","6"],"Slope = (8 − 2)/(3 − 0) = 6/3 = 2."],
  [M,"Which expression equals (x + 3)(x − 3)?","x² − 9",["x² + 9","x² − 6x + 9","x² + 6x − 9"],"Use the difference of squares formula."],
  [M,"What is the positive solution of x² = 49?","7",["−7","14","24.5"],"The positive square root of 49 is 7."],
  [M,"A quantity starts at 80 and is multiplied by 3 each day. What is its value after 2 days?","720",["160","240","480"],"80 × 3² = 720."],
  [M,"For x ≠ 0, 6x²/(3x) equals which expression?","2x",["2x²","3x","18x"],"Divide coefficients 6/3 = 2 and subtract exponents x²/x = x."],
  [M,"If √(x + 7) = 6, what is x?","29",["13","36","43"],"x + 7 = 36, hence x = 29."],
  [M,"What is the minimum value of y = x² + 4?","4",["0","2","8"],"x² is at least zero and equals zero at x = 0."],
  [M,"Which expression equals b³ × b² for b > 0?","b⁵",["b⁶","b","2b⁵"],"Add exponents: 3 + 2 = 5."],
  [D,"A $50 item is discounted by 20%. What is its sale price?","$40",["$10","$30","$45"],"Twenty percent of 50 is 10; 50 − 10 = 40."],
  [D,"What is the median of 2, 5, 8, 11 and 14?","8",["5","7","11"],"The already ordered list has 8 as its middle value."],
  [D,"A spinner has 8 equal sectors, of which 2 are red. What is the probability of landing on red? Give a fraction or decimal.","1/4",["1/2","1/8","3/4"],"2/8 simplifies to 1/4, which is 0.25."],
  [D,"A car travels 180 kilometres in 3 hours at a constant speed. What is that speed?","60 km/h",["30 km/h","90 km/h","540 km/h"],"Speed = distance/time = 180/3 = 60 km/h."],
  [G,"A rectangle has length 9 and width 4. What is its perimeter?","26",["13","18","36"],"Perimeter is 2(9 + 4) = 26."],
  [G,"A triangle has angles 45° and 65°. How many degrees is its third angle?","70",["65","80","110"],"The angles sum to 180°, so 180 − 45 − 65 = 70."],
  [G,"A rectangular prism has dimensions 3, 4 and 5. What is its volume?","60",["12","24","47"],"Volume is 3 × 4 × 5 = 60."],
];
const higher: Row[] = [
  [A,"For what value of k does the system 2x + 3y = 8 and 4x + ky = 17 have no solution?","6",["3","4","8"],"Parallel distinct lines require the second left side to double the first: k = 6. The constants 17 and 16 then differ."],
  [A,"A solution contains 20% salt. How many litres of water must be added to 10 litres of this solution to obtain a 12.5% salt solution?","6",["4","5","8"],"There are 2 litres of salt. Total volume must be 2/0.125 = 16 litres, requiring 6 litres of water."],
  [A,"A line with equation ax + 4y = 20 is perpendicular to a line of slope 2. What is a?","2",["−8","−2","8"],"The first slope is −a/4. Set −a/4 = −1/2, giving a = 2."],
  [A,"A theatre sold 80 tickets at $9 or $15 each, collecting $912. How many $15 tickets were sold?","32",["24","38","48"],"9(80 − h) + 15h = 912 gives 720 + 6h = 912, so h = 32."],
  [A,"If 3(2x − 5) ≤ 4x + 9, what is the greatest permitted value of x?","12",["6","9","24"],"6x − 15 ≤ 4x + 9 gives 2x ≤ 24, hence x ≤ 12."],
  [A,"A company charges C(n) = 140 + 18n dollars. A competitor charges D(n) = 40 + 23n dollars. For what n are the costs equal?","20",["10","18","25"],"140 + 18n = 40 + 23n implies 100 = 5n, so n = 20."],
  [A,"The equation a(x − 2) = 5x − 10 has infinitely many real solutions. What is a?","5",["2","−5","10"],"For an identity, coefficients of x and constants must agree: a = 5 and −2a = −10."],
  [A,"If 2p + 3q = 19 and 4p − q = 17, what is p + q?","8",["5","6","7"],"q = 4p − 17 gives 14p = 70, so p = 5 and q = 3. Therefore p + q = 8."],
  [M,"For what value of c does x² − 12x + c have exactly one distinct real zero?","36",["6","12","144"],"The discriminant is 144 − 4c = 0, so c = 36."],
  [M,"The function f(x) = x² − 8x + 21 has what minimum value?","5",["−5","4","21"],"Complete the square: f(x) = (x − 4)² + 5."],
  [M,"An investment grows according to V(t) = 500(1.04)^t. Which expression gives its value after t years plus another 5 years?","500(1.04)^(t+5)",["500(1.04)^t + 5","500(1.09)^t","525(1.04)^t"],"Replace elapsed time with t + 5; compound growth is multiplicative, not additive."],
  [M,"For x ≠ −2, which expression equals (x² + x − 2)/(x + 2)?","x − 1",["x + 1","x − 2","x + 2"],"The numerator factors as (x + 2)(x − 1); cancel x + 2 when nonzero."],
  [M,"What is the solution of √(x + 4) = x − 2?","5",["0","2","4"],"Require x ≥ 2. Squaring gives x + 4 = x² − 4x + 4, so x(x − 5) = 0. Only 5 satisfies the original equation."],
  [M,"A quadratic has zeros −3 and 5 and passes through (0, −30). What is its leading coefficient?","2",["−2","1","3"],"Write y = a(x + 3)(x − 5). At x = 0, −30 = −15a, so a = 2."],
  [M,"For x > 0, which expression equals (x^(3/2))^(4/3)?","x²",["x^(7/6)","x^(9/8)","x³"],"Multiply exponents: (3/2)(4/3) = 2."],
  [D,"A value increases by 25%, then decreases by 20%. Relative to its original value, the final value is:","unchanged",["5% greater","5% smaller","10% greater"],"The combined multiplier is 1.25 × 0.8 = 1."],
  [D,"Group A has 12 observations with mean 15. Group B has 8 observations with mean 25. What is the combined mean?","19",["18","20","21"],"Total sum is 12×15 + 8×25 = 380; divide by 20 to get 19."],
  [D,"A sample contains 30 adults, including 18 cyclists, and 20 teenagers, including 16 cyclists. If a cyclist is selected at random from the sample, what is the probability that this person is a teenager? Give a fraction or decimal.","8/17",["2/5","4/5","16/50"],"There are 34 cyclists, 16 of whom are teenagers. The conditional probability is 16/34 = 8/17."],
  [D,"A regression predicts y = 2.4x + 7. An observation at x = 5 has y = 22. What is its residual, observed minus predicted?","3",["−3","7","19"],"Predicted y = 2.4×5 + 7 = 19. Residual is 22 − 19 = 3."],
  [G,"A circle has equation (x − 3)² + (y + 2)² = 36. Which point is its centre?","(3, −2)",["(−3, 2)","(3, 2)","(−2, 3)"],"In (x − h)² + (y − k)² = r², the centre is (h,k) = (3,−2)."],
  [G,"In a right triangle, sin θ = 5/13 for an acute angle θ. What is tan θ? Give a fraction or decimal.","5/12",["12/13","12/5","13/5"],"The opposite and hypotenuse can be 5 and 13, so the adjacent side is 12. Tangent is 5/12."],
  [G,"Two similar solids have corresponding lengths in the ratio 2:3. The smaller volume is 48. What is the larger volume?","162",["72","108","216"],"Volume scales as the cube: 48×(3/2)³ = 162."],
];
export function mathModule(route: "first" | "lower" | "higher") {
  const rows = route === "first" ? first : route === "lower" ? lower : higher;
  const numeric = route === "first" ? [3,7,12,17,20] : [3,7,12,17,20,21];
  return rows.map(([domain, prompt, answer, wrong, explanation], i) => {
    const q = choice(`sat-math-${route}-${i+1}-v1`,domain,"",prompt,answer,wrong,explanation);
    if (numeric.includes(i)) { q.kind = "number"; delete q.options; }
    return { ...q, pretest: i === 5 || i === 18 };
  });
}
