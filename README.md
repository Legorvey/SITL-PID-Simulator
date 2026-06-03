# SITL PID Control Telemetry Dashboard

A web-based Software-in-the-Loop (SITL) simulator engineered for dynamic plant response analysis, real-time actuator saturation testing, and heuristic tuning optimization. 

This project serves as a visual bridge between control theory mathematics and software engineering implementation, designed primarily for heuristic learning and technical demonstration.

## 🎯 Target Audience
* **Best suited for:** Engineering students visualizing closed-loop feedback theory, technical recruiters evaluating software-hardware integration logic, and developers exploring continuous discrete calculus in web environments.
* **Not intended for:** Mission-critical system design (e.g., aerospace, power plant turbine control). This is a conceptual simulator, not a deterministic hardware validation tool.

## ⚙️ Core Architecture & Capabilities
The system utilizes continuous discrete calculus to compute physical momentum and actuator limits in real-time, bypassing static pre-calculated array approximations.

* **Physics Engine:** Real-time Euler Integration operating at a 100Hz discrete loop.
* **Control Logic:** Proportional-Integral-Derivative (PID) algorithm featuring **actuator saturation clamping** (-255 to 255) and **Integrator Anti-Windup** mechanics.
* **Live Telemetry:** Infinite-loop rendering (`requestAnimationFrame`) allows for real-time PID parameter manipulation without resetting the timeline momentum.
* **Environmental Stress Testing:** 
  * Inject realistic sensor noise to evaluate derivative filter limits.
  * Trigger external load disturbances (-150.0 amplitude) to test Integral recovery and rejection capabilities.
* **Advanced Analytics:** Auto-computes Maximum Overshoot, Steady-State Error (SSE), Rise Time (10-90%), and Settling Time (2% tolerance) on static step responses.

## ⚠️ System Limitations (Engineering Context)
To maintain academic and engineering integrity, the following limitations are acknowledged:
1. **Non-Deterministic Execution:** Built on a single-threaded JavaScript (V8) engine without a Real-Time Operating System (RTOS). Loop timing is dependent on browser frame rates, lacking the *hard real-time* precision of industrial PLCs.
2. **Basic Numerical Methods:** Utilizes first-order Euler integration for browser performance. It lacks the precision of advanced differential solvers like Runge-Kutta 4th Order (RK4) used in industry-standard software (e.g., MATLAB/Simulink), making it prone to drift over long durations.
3. **Idealized Linear Models:** The embedded plant models (Drone/Boiler) use linear approximations. Real-world industrial plants possess complex non-linearities, dead-times, dynamic friction, and hysteresis not accounted for in this simulation.

## 💻 Tech Stack
* **Framework:** Next.js (App Router) for optimal Client-Side Rendering (CSR).
* **Styling:** Tailwind CSS (SaaS-grade Glassmorphism UI).
* **Visualization:** Plotly.js for scientific-grade telemetry graphing.
* **Deployment:** Vercel.

## 🚀 Local Installation

Ensure you have Node.js installed. Clone the repository and install the dependencies:

```bash
git clone [https://github.com/Legorvey/SITL-PID-Simulator.git](https://github.com/Legorvey/SITL-PID-Simulator.git)
cd SITL-PID-Simulator
npm install
