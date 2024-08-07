function bertalanffy_analytic_solution(t, v0, v∞, ω, λ)
    v0 == 0 && return 0
    v∞ == 0 && return NaN
    sign(v0)*sign(v∞) == -1 && return NaN
    λ == 0 && return (v0/v∞)^exp(-ω*t)*v∞
    base = 1 + ((v0/v∞)^λ - 1)*exp(-ω*t)
    base < 0 && return NaN
    base^(1/λ)*v∞
end

"""
    bertalanffy(times, p)

Return volumes for specified `times`, based on the analytic solution to the General
Bertalanffy model for lesion growth.  $(DOC_PARAMS(4, :bertalanffy_ode)). Other parameters
are explained below.

Special cases of the model are:

- [`logistic`](@ref) (`λ = -1`)
- [`classical_bertalanffy`](@ref)  (`λ = 1/3`)
- [`gompertz`](@ref) (`λ = 0`)

$DOC_BERTALANFFY_ODE

$DOC_SEE_ALSO

"""
function bertalanffy(times, p)
    @unpack v0, v∞, ω, λ = p
    t0 = first(times)
    b(t) = bertalanffy_analytic_solution(t - t0, v0, v∞, ω, λ)
    return b.(times)
end

guess_parameters(times, volumes, ::typeof(bertalanffy)) =
    merge(guess_parameters(times, volumes, gompertz), (; λ=1/3))

function scale_default(times, volumes, model::typeof(bertalanffy))
    p = guess_parameters(times, volumes, model)
    volume_scale = abs(p.v∞)
    time_scale = 1/abs(p.ω)
    return p -> (v0=volume_scale*p.v0, v∞=volume_scale*p.v∞, ω=p.ω/time_scale, λ=p.λ)
end

lower_default(model::typeof(bertalanffy)) = lower_default(classical_bertalanffy)
penalty_default(::typeof(bertalanffy)) = 0.8

iterations_default(::typeof(bertalanffy), optimiser) = 20000
iterations_default(::typeof(bertalanffy), optimiser::GaussNewtonOptimiser) = 0
