"""
    bertalanffy_numerical(times, p; solve_kwargs...)

*Provided for testing purposes.*

Return volumes for specified `times`, based on numerical solutions to the General
Bertalanffy model for lesion growth. $(DOC_PARAMS(4, bertalanffy_ode)); `solve_kwargs` are
optional keyword arguments for the ODE solver, `DifferentialEquations.solve`, from
DifferentialEquations.jl.

Since it is based on analtic solutions, [`bertalanffy`](@ref) is the preferred alternative
to this function.

!!! important

    It is assumed without checking that `times` is ordered: `times == sort(times)`.

See also [`bertalanffy2`](@ref).

"""
function bertalanffy_numerical(
    times,
    p;
    saveat = times,
    sensealg = Sens.InterpolatingAdjoint(; autojacvec = Sens.ZygoteVJP()),
    kwargs..., # other DE.solve kwargs, eg, `reltol`, `abstol`
    )

    @unpack v0, v∞, ω, λ = p

    # We rescale volumes by `v∞` before sending to solver. It is tempting to perform a
    # time-rescaling, but an issue prevents this:
    # https://github.com/SciML/SciMLSensitivity.jl/issues/1002
    tspan = (times[1], times[end])
    p_ode = [1.0, ω, λ]
    problem = DE.ODEProblem(bertalanffy_ode, [v0/v∞,], tspan, p_ode)
    solution = DE.solve(problem, DE.Tsit5(); saveat, sensealg, kwargs...)
    # return to original scale:
    return v∞ .* first.(solution.u)
end

guess_parameters(times, volumes, ::typeof(bertalanffy_numerical)) =
    guess_parameters(times, volumes, bertalanffy)

scale_default(times, volumes, model::typeof(bertalanffy_numerical)) =
    scale_default(times, volumes, bertalanffy)

lower_default(::typeof(bertalanffy_numerical)) = lower_default(bertalanffy)
upper_default(::typeof(bertalanffy_numerical)) = upper_default(bertalanffy)
