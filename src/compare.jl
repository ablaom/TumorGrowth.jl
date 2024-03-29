const ERR_MODEL_NOT_VECTOR = ArgumentError(
    "The argument `models` in a call like `ModelComparison(times, volumes, models)` "*
        "must be a vector. "
)
const ERR_MISMATCH = DimensionMismatch(
    "Either `calibration_options` `n_iterations` has a length different from the "*
    "number of models (which must be a vector other iterable). "
)

mae(ŷ, y) = abs.(ŷ .- y) |> mean

struct ModelComparison{T<:Real, MTuple<:Tuple, OTuple<:Tuple, N, M, PTuple<:Tuple}
    times::Vector{T}
    volumes::Vector{T}
    models::MTuple
    holdouts::Int
    options::OTuple
    n_iterations::NTuple{N,Int64}
    metric::M
    errors::Vector{T}
    parameters::PTuple
    function ModelComparison(
        times::Vector{T},
        volumes::Vector{T},
        models;
        holdouts=3,
        calibration_options = options.(models),
        n_iterations = n_iterations.(models),
        metric=mae,
        plot=false,
        flag_out_of_bounds=false,
        ) where T<:Real

        length(models) == length(calibration_options) == length(n_iterations) ||
            throw(ERR_MISMATCH)
        _models = Tuple(models)
        _options = Tuple(calibration_options)
        errors, parameters =
            TumorGrowth.errors(
                times,
                volumes,
                _models,
                holdouts,
                _options,
                n_iterations,
                plot,
                flag_out_of_bounds,
            ) # defined below
        MTuple = typeof(_models)
        OTuple = typeof(_options)
        new{T, MTuple, OTuple, length(n_iterations), typeof(metric), typeof(parameters)}(
            times,
            volumes,
            _models,
            holdouts,
            _options,
            Tuple(n_iterations),
            metric,
            errors,
            parameters,
        )
    end
end

"""
    compare(times, volumes, models; holdouts=3, metric=mae, advanced_options...)

By calibrating `models` using the specified patient `times` and lesion `volumes`, compare
those models using a hold-out set consisting of the last `holdouts` data points.

```julia
times = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]
volumes = [0.00023, 8.4e-5, 6.1e-5, 4.3e-5, 4.3e-5, 4.3e-5]

julia> comparison = compare(times, volumes, [gompertz, logistic])
ModelComparison with 3 holdouts:
  metric: mae
  gompertz:     2.198e-6
  logistic:     6.55e-6

julia> errors(comparison)
2-element Vector{Float64}:
 2.197843662660861e-6
 6.549858321487298e-6

julia> p = parameters(comparison)[1]  # calibrated parameter for `gompertz`
(v0 = 0.00022643603114569068, v∞ = 3.8453274218216947e-5, ω = 0.11537512108224635)

julia> gompertz(times, p)
6-element Vector{Float64}:
 0.00022643603114569068
 9.435316392754094e-5
 5.1039159299783234e-5
 4.303209015899451e-5
 4.021112910411027e-5
 3.922743006690166e-5
```

When a model parameter becomes out of bounds, calibration stops early and the last
in-bounds value is reported.

# Visualing comparisons

```julia
using Plots
plot(comparison, title="A comparison of two models")
```

# Keyword options

- `holdouts=3`: number of time-volume pairs excluded from the end of the calibration data

- `metric=mae`: metric applied to holdout set; the reported error on a model predicting
  volumes `v̂` is `metric(v̂, v)` where `v` is the last `holdouts` values of `volumes`. For
  example, any regression measure from StatisticalMeasures.jl can be used here. The
  built-in fallback is mean absolute error.

- `n_iterations=TumorGrowth.n_iterations.(models)`: a vector of iteration counts for the
  calibration of `models`

- `calibration_options=TumorGrowth.options.(models)`: a vector of named tuples providing
  the keyword arguments for `CalibrationProblem`s - one for each model. See
  [`CalibrationProblem`](@ref) for details.

- `flag_out_of_bounds=false`: set to `true` to report `NaN` as the error for a model whose
  parameter became out of bounds during calibration. Otherwise, the error for the last
  in-bounds parameter is reported.

See also [`errors`](@ref), [`parameters`](@ref).

"""
compare(args...; kwargs...) = ModelComparison(args...; kwargs...)

"""
    errors(comparison)

Extract the the vector of errors from a `ModelComparison` object, as returned by
calls to [`compare`](@ref).

"""
errors(comparison::ModelComparison) = comparison.errors

"""
    errors(comparison)

Extract the the vector of errors from a `ModelComparison` object, as returned by
calls to [`compare`](@ref).

"""
parameters(comparison::ModelComparison) = comparison.parameters


function errors(
    etimes,
    evolumes,
    models,
    holdouts,
    options,
    n_iterations,
    plot,
    flag_out_of_bounds,
    )

    times = etimes[1:end-holdouts]
    volumes = evolumes[1:end-holdouts]

    i = 0
    error_param_pairs = map(models) do model
        i += 1
        n_iter = n_iterations[i]
        problem = CalibrationProblem(times, volumes, model; options[i]...)
        controls = Any[Step(1), InvalidValue(), NumberLimit(n_iter)]
        plot && push!(controls, IterationControl.skip(
            Callback(pr-> (TumorGrowth.plot(pr); TumorGrowth.gui())),
            predicate=div(n_iter, 50),
        ))
        outcomes = solve!(problem, controls...)
        out_of_bounds = outcomes[2][2].done
        p = solution(problem)
        if out_of_bounds && flag_out_of_bounds
            error = NaN
        else
            v̂ = model(etimes, p)
            error = mae(v̂[end-holdouts+1:end], evolumes[end-holdouts+1:end])
        end
        (error, p)
    end

    error_tuple, params = zip(error_param_pairs...)
    return collect(error_tuple), params
end

function Base.show(io::IO, comparison::ModelComparison)
    println(io, "ModelComparison with $(comparison.holdouts) holdouts:")
    print(io, "  metric: $(comparison.metric)")
    for (i, model) in enumerate(comparison.models)
        error = round(comparison.errors[i], sigdigits=4)
        print(io, "\n  $model: \t$error")
    end
    return nothing
end
