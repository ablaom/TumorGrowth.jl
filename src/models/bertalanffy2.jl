"""
    bertalanffy2(times, p; capacity=false, solve_kwargs...)

Return volumes for specified `times`, based on numerical solutions to a two-dimensional
extension of General Bertalanffy model for lesion growth. $(DOC_PARAMS(5,
:bertalanffy2_ode!)).

The usual General Bertalanffy model is recovered when `γ=0`. In that case, using
[`bertalanffy`](@ref), which is based on an analytic solution, may be preferred. Other
parameters are explained below.

# Keyword options

- `solve_kwargs`: optional keyword arguments for the ODE solver,
  `DifferentialEquations.solve`, from DifferentialEquations.jl.

# Underlying ODE

In this model the carrying capacity of the [`bertalanffy`](@ref) model, ordinarily fixed,
is introduced as a new latent variable ``u(t)``, which is allowed to evolve independently
of the volume ``v(t)``, at a rate in proportion to its magnitude:

`` dv/dt = ω B_λ(u/v) v``

`` du/dt = γωu ``

Here ``B_λ`` is the Box-Cox transformation with exponent ``λ``. See
[`bertalanffy`](@ref). Also:

- ``1/ω`` has units of time
- ``λ`` is dimensionless
- ``γ`` is dimensionless

Since ``u`` is a latent variable, its initial value, `v∞ ≡ u(times[1])`, is an additional
model parameter.

$DOC_SEE_ALSO

"""
function bertalanffy2(
    times,
    p;
    sensealg = Sens.InterpolatingAdjoint(; autojacvec = Sens.ZygoteVJP()),
    # this default determined by experiments with patient with id
    # "44f2f0cc8accfe91e86f0df74346a9d4-S3"; don't raise it without further investigation.
    reltol = 1e-7,
    ode_options...,
    )

    times == sort(times) || throw(ERR_UNORDERED_TIMES)

    @unpack v0, v∞, ω, λ, γ = p

    # We rescale volumes by `v∞` before sending to solver. It is tempting to perform a
    # time-rescaling, but an issue prevents this:
    # https://discourse.julialang.org/t/time-normalisation-results-in-nothing-gradients-of-ode-solutions/109353
    tspan = (times[1], times[end])
    q0 = [v0/v∞, 1.0]
    p = [ω, λ, γ]
    problem = DE.ODEProblem(bertalanffy2_ode!, q0, tspan, p)
    solution = DE.solve(problem, DE.Tsit5(); saveat=times, sensealg, reltol, ode_options...)

    # return to original scale:
    volumes = v∞ .* first.(solution.u)

    # if the solution became unstable, we need to extend with NaN's:
    TumorGrowth.is_okay(solution) && return volumes
    return append!(volumes, fill(NaN, length(times) - length(volumes)))
end

function guess_parameters(times, volumes, ::typeof(bertalanffy2))
    κ = 0.5*sign(TumorGrowth.curvature(times, volumes))
    fallback =  merge(guess_parameters(times, volumes, bertalanffy), (; γ=κ))

    problem = CalibrationProblem(
        times,
        volumes,
        bertalanffy;
        learning_rate=0.0001,
        penalty=1.0,
    )

    try
        outcomes = @suppress solve!(problem, Step(1), InvalidValue(), NumberLimit(1000))
        outcomes[2][2].done && return fallback # out of bounds
        return merge(solution(problem), (; γ=κ))
    catch
        return fallback
    end

end

function scale_default(times, volumes, model::typeof(bertalanffy2))
    p = guess_parameters(times, volumes, model)
    volume_scale = abs(p.v∞)
    time_scale = 1/abs(p.ω)
    p -> (v0=volume_scale*p.v0, v∞=volume_scale*p.v∞, ω=p.ω/time_scale, λ=p.λ, γ=p.γ)
end

lower_default(::typeof(bertalanffy2)) = lower_default(classical_bertalanffy)
upper_default(::typeof(bertalanffy2)) = upper_default(classical_bertalanffy)
penalty_default(::typeof(bertalanffy2)) = 0.8
