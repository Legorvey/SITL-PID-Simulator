# Industrial-Grade PID Control Telemetry

A high-performance Software-in-the-Loop (SITL) platform engineered for dynamic plant response analysis, real-time actuator saturation testing, and heuristic tuning optimization.

## Core Architecture
This simulator utilizes discrete calculus to compute physical momentum and actuator limits in real-time, moving beyond static array approximations.

* **Physics Engine:** Euler Integration operating at 100Hz.
* **Control Logic:** Proportional-Integral-Derivative (PID) with anti-windup clamping.
* **Telemetry Loop:** Continuous infinite-loop rendering (`requestAnimationFrame`) for live momentum manipulation without timeline resets.

## Technical Capabilities
1. **Dynamic Plant Selection:** Test configurations on abstract models including BLDC Motors and Industrial Heaters.
2. **Signal Tracking:** Evaluate transient responses using Unit Step, Square Wave, and Sine Wave reference signals at variable frequencies.
3. **Environmental Stress Testing:** 
   * Inject realistic sensor noise to test derivative filter limits.
   * Trigger external load disturbances (-150.0 amplitude) to evaluate the Integral component's rejection capability.
4. **Advanced Analytics:** Computes Maximum Overshoot, Steady-State Error (SSE), Rise Time (10-90%), and Settling Time (2% tolerance) on static step responses.

## Tech Stack
* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS (Glassmorphism & SaaS-grade UI)
* **Visualization:** Plotly.js (Scientific graphing)
* **Deployment:** Vercel

## Local Installation

Ensure you have Node.js installed. Clone the repository and install the dependencies:

```bash
git clone [https://github.com/Legorvey/SITL-PID-Simulator.git](https://github.com/Legorvey/SITL-PID-Simulator.git)
cd SITL-PID-Simulator
npm install
