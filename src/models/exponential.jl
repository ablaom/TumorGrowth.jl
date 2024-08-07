exponential_analytic_solution(t, v0, ω) = v0*exp(-ω*t)

"""
    exponential(times, p)

Return volumes for specified `times`, based on the analytic solution to the exponential
model for lesion growth. Here `p` will have properties `v0` and `ω`, where `v0` is the
volume at time `times[1]` and `log(2)/ω` is the half life. Use negative `ω` for growth and
positive `ω` for decay.

# Underlying ODE

In the exponential model, the volume ``v > 0`` evolves according to the differential
equation

`` dv/dt = -ω v.``

$DOC_SEE_ALSO

"""
function exponential(times, p)
    @unpack v0, ω = p
    t0 = first(times)
    b(t) = exponential_analytic_solution(t - t0, v0, ω)
    return b.(times)
end

function guess_parameters(times, volumes, ::typeof(exponential))
    v0 = first(volumes)
    mask = volumes .> eps(float(eltype(volumes)))
    all(broadcast(!, mask)) && throw(ERR_VOLUMES_TOO_SMALL)
    volumes = volumes[mask]
    if length(volumes) > 1
        times = times[mask]
        ys = log.(volumes)
        ω = -TumorGrowth.slope(times, ys)
    else
        ω = inv(last(times) - first(times))
    end
    return (; v0, ω)
end

function scale_default(times, volumes, model::typeof(exponential))
    p = guess_parameters(times, volumes, model)
    volume_scale = abs(p.v0)
    time_scale = log(2)/abs(p.ω)
    return p -> (v0=volume_scale*p.v0, ω=p.ω/time_scale)
end

lower_default(model::typeof(exponential)) =  (; v0=0)
penalty_default(::typeof(exponential)) = 0.8
