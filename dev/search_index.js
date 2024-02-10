var documenterSearchIndex = {"docs":
[{"location":"quick_start/#Quick-start","page":"Quick start","title":"Quick start","text":"","category":"section"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"First, let's grab some real clinical data from Laleh et al. (2022) \"Classical mathematical models for prediction of response to chemotherapy and immunotherapy\", PLOS Computational Biology\":","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"using TumorGrowth\n\ndata = patient_data();\nrecord = data[16]   # storing all measurements for one lesion\nkeys(record)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"Next, we calibrate the generalized Bertalanffy model using this particular patient record:","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"times = record.T_weeks\nvolumes = record.Lesion_normvol  # volumes normalized by max over dataset\n\nproblem = CalibrationProblem(times, volumes, bertalanffy)\nsolve!(problem, 2000)  # apply 2000 iterations of the calibration algorithm\np = solution(problem)\npretty(p)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"For advanced  options, see CalibrationProblem.","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"We can visualize the outcome and make predictions for an extended time period:","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"using Plots\nplot(problem)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"(Image: )","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"extended_times = vcat(times, [46.0, 53.1])\nbertalanffy(extended_times, p)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"And compare several models on a holdout set:","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"comparison = compare(times, volumes, [bertalanffy, logistic, bertalanffy2], holdouts=2)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"plot(comparison)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"(Image: )","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"See compare for more options.","category":"page"},{"location":"reference/#Reference","page":"Reference","title":"Reference","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"Modules = [TumorGrowth,]","category":"page"},{"location":"reference/#TumorGrowth.CalibrationProblem-Tuple{Any, Any, Any}","page":"Reference","title":"TumorGrowth.CalibrationProblem","text":"    CalibrationProblem(times, volumes, model; learning_rate=0.0001, options...)\n\nSpecify a problem concerned with optimizing the parameters of a tumor growth model, given measured volumes and corresponding times.\n\nHere model can be one of: bertalanffy, bertalanffy_numerical, bertalanffy2, gompertz, logistic, classical_bertalanffy.\n\nDefault optimisation is by Adam gradient descent, using a sum of squares loss. Call solve! on a problem to carry out optimisation, as shown in the example below. See \"Extended Help\" for advanced options, including early stopping.\n\nInitial values of the parameters are inferred by default.\n\nSimple solve\n\nusing TumorGrowth\n\ntimes = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\nvolumes = [0.00023, 8.4e-5, 6.1e-5, 4.3e-5, 4.3e-5, 4.3e-5]\nproblem = CalibrationProblem(times, volumes, gompertz; learning_rate=0.01)\nsolve!(problem, 30)    # apply 30 gradient descent updates\njulia> loss(problem)   # sum of squares loss\n1.7341026729860452e-9\n\np = solution(problem)\njulia> pretty(p)\n\"v0=0.0002261  v∞=2.792e-5  ω=0.05731\"\n\n\nextended_times = vcat(times, [42.0, 46.0])\njulia> gompertz(extended_times, p)[[7, 8]]\n2-element Vector{Float64}:\n 3.374100207406809e-5\n 3.245628908921241e-5\n\nExtended help\n\nSolving with iteration controls\n\nContinuing the example above, we may replace the number of iterations, n, in solve!(problem, n), with any control from IterationControl.jl:\n\nusing IterationControl\nsolve!(\n  problem,\n  Step(1),            # apply controls every 1 iteration...\n  WithLossDo(),       # print loss\n  Callback(problem -> print(pretty(solution(problem)))), # print parameters\n  InvalidValue(),     # stop for ±Inf/NaN loss, incl. case of out-of-bound parameters\n  NumberSinceBest(5), # stop when lowest loss so far was 5 steps prior\n  TimeLimit(1/60),    # stop after one minute\n  NumberLimit(400),   # stop after 400 steps\n)\np = solution(problem)\njulia> loss(problem)\n7.609310030658547e-10\n\nSee IterationControl.jl for all options.\n\nVisualizing results\n\nusing Plots\nscatter(times, volumes, xlab=\"time\", ylab=\"volume\", label=\"train\")\nplot!(problem, label=\"prediction\")\n\nModels\n\nA model can be any callable object returning volumes given times and parameters, as in predicted_volumes = model(times, p). TumorGrowth.jl supplies the following built-in models:\n\nmodel description parameters, p analytic? ODE\nbertalanffy generalized Bertalanffy (GB) (; v0, v∞, ω, λ) yes TumorGrowth.bertalanffy_ode\nbertalanffy_numerical generalized Bertalanffy (testing only) (; v0, v∞, ω, λ) no TumorGrowth.bertalanffy_ode\nbertalanffy2 2D extension of generalized Bertalanffy (; v0, v∞, ω, λ, γ) no TumorGrowth.bertalanffy2_ode!\ngompertz Gompertz (GB, λ=0) (; v0, v∞, ω) yes TumorGrowth.bertalanffy_ode\nlogistic logistic/Verhulst (GB, λ=-1) (; v0, v∞, ω) yes TumorGrowth.bertalanffy_ode\nclassical_bertalanffy classical Bertalanffy (GB, λ=1/3) (; v0, v∞, ω) yes TumorGrowth.bertalanffy_ode\nneural2(rng, network) neural2 ODE with Lux.jl network (; v0, v∞, θ) no TumorGrowth.neural_ode\n\nIn every case v0 is the initial volume (so that predicted_volumes[1] == v0). Note this can be different from volumes[1].\n\nKeyword options\n\np0: initial value of the model parameters (always a vector); inferred by default for built-in models\ng=(p-> true): constraint function: If g(p) == false for some parameter p, then a warning is given and solution(problem) is frozen at the last constrained value of p; use solve!(problem, Step(1), InvalidValue(), ...) to ensure early stopping (which works because IterationControl.loss(problem) will return Inf in that case). If unspecified, the constraint function is inferred in the case of built-in models and parameters are otherwise unconstrained.\nfrozen: a named tuple, such as (; v0=nothing, λ=1/2); indicating parameters to be frozen at specified values during optimization; a nothing value means freeze at initial value.\nlearning_rate=0.0001: learning rate for Adam gradient descent optimiser\noptimiser=Optimisers.Adam(learning_rate): optimiser; must be from Optimisers.jl.\nscale: a scaling function with the property that p = scale(q) has a value of the same order of magnitude for the problem parameters being optimised, whenever q has the same form as p but with all values equal to one. Scaling ensures gradient descent learns all components of p at a similar rate. If unspecified, scaling is inferred for built-in models, and uniform otherwise.\n\nhalf_life=Inf: set to a real positive number to replace the sum of squares loss with a weighted version; weights decay in reverse time with the specified half_life\npenalty=0.0 (range=0 )): the larger the positive value, the more a loss function modification discourages large differences in v0 and v∞ on a log scale. Helps discourage v0 and v∞ drifting out of bounds in models whose ODE have a singularity at the origin (all built-in models except the neural network models).\node_options...: optional keyword arguments for the ODE solver, DifferentialEquations.solve, from DifferentialEquations.jl. Not relevant for models using analytic solutions (see table above).\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.CalibrationProblem-Tuple{CalibrationProblem}","page":"Reference","title":"TumorGrowth.CalibrationProblem","text":"CalibrationProblem(problem; kwargs...)\n\nConstruct a new calibration problem out an existing problem but supply new keyword arguments, kwargs. Unspecified keyword arguments fall back to defaults, except for p0, which falls back to solution(problem).\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.WeightedL2Loss","page":"Reference","title":"TumorGrowth.WeightedL2Loss","text":"WeightedL2Loss(times, h=Inf)\n\nPrivate method.\n\nReturn a weighted sum of squares loss function (ŷ, y) -> loss, where the weights decay in reverse time with a half life h.\n\n\n\n\n\n","category":"type"},{"location":"reference/#TumorGrowth.bertalanffy-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy","text":"bertalanffy(times, p)\n\nReturn volumes for specified times, based on the analytic solution to the generalized     Bertalanffy model for lesion growth.  Here p will have properties v0, v∞, ω, λ, where v0 is the volume at time times[1] and the other parameters are explained in the TumorGrowth.bertalanffy_ode document string.\n\nSee also bertalanffy2.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy2-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy2","text":"bertalanffy2(times, p; aspirational=false, solve_kwargs...)\n\nReturn volumes for specified times, based on numerical solutions to a two-dimensional extension of generalized Bertalanffy model for lesion growth. Here Here p will have properties v0, v∞, ω, λ, γ, where v0 is the volume at time times[1] and the other parameters are explained in the TumorGrowth.bertalanffy2_ode! document string.\n\nThe usual generalized Bertalanffy model is recovered when γ=0. In that case, using bertalanffy, which is based on an analytic solution, may be preferred.\n\nimportant: Important\nIt is assumed without checking that times is ordered: times == sort(times).\n\nKeyword options\n\naspirational=false: Set to true to return the aspirational volumes, in addition to the actual volumes.\nsolve_kwargs: optional keyword arguments for the ODE solver, DifferentialEquations.solve, from DifferentialEquations.jl.\n\nSee also bertalanffy.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy2_ode!-NTuple{4, Any}","page":"Reference","title":"TumorGrowth.bertalanffy2_ode!","text":"bertalanffy2_ode!(dX, X, p, t)\n\nA two-dimensional extension of the generalized TumorGrowth.model for lesion growth (see bertalanffy_ode). Here X = [v, u], where v is volume at time t and u is the \"aspirational volume\" at time t, a latent variable. The time derivatives are written to dX. Specifically, dX will have these components:\n\ndvdt = ω((uv)^λ - 1)λ)v dudt = γωu\n\nwhere [ω, λ, γ] == p are fixed parameters:\n\n1ω has units of time\nλ is dimensionless\nγ is dimensionless\n\nWhen γ = 0 the model collapses to the (one-dimensional) TumorGrowth.model. In that special case, λ = -1, gives the logistic (Verhulst) model, while λ = 13 gives the classical TumorGrowth.model.  In the case λ = 0, the implementation replaces ((uv)^λ - 1)λ with its limiting value log(uv) to recover the Gompertz model when also γ = 0.\n\nSince u is a latent variable, its initial value is an additional model parameter.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy_numerical-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy_numerical","text":"bertalanffy_numerical(times, p; solve_kwargs...)\n\nProvided for testing purposes.\n\nReturn volumes for specified times, based on numerical solutions to the generalized Bertalanffy model for lesion growth. Here p will have properties v0, v∞, ω, λ, where v0 is the volume at time times[1] and the other parameters are explained in the TumorGrowth.bertalanffy_ode document string; solve_kwargs are optional keyword arguments for the ODE solver, DifferentialEquations.solve, from DifferentialEquations.jl.\n\nSince it is based on analtic solutions, bertalanffy is the preferred alternative to this function.\n\nimportant: Important\nIt is assumed without checking that times is ordered: times == sort(times).\n\nSee also bertalanffy2.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy_ode-Tuple{Any, Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy_ode","text":"bertalanffy_ode(v, p, t)\n\nBased on the general TumorGrowth.model, return the rate in change in volume at time t, for a current volume of v. This first order, autonomous, one-dimensionaly ODE model is given by\n\ndvdt = ω((vv)^λ - 1)λ)v v0\n\nwhere [v∞, ω, λ] == p are parameters::\n\nv is the steady state solution, stable and unique, assuming ω  0\n1ω has the units of time\nλ is dimensionless\n\nWhen λ = -1, one recovers the logistic (Verhulst) model, while λ = 13 gives the classical TumorGrowth.model.  In the case λ = 0, the implementation replaces ((vv)^λ - 1)λ with its limiting value log(vv) to recover the Gompertz model.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.classical_bertalanffy-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.classical_bertalanffy","text":"classical_bertalanffy(times, v0, v∞, ω)\n\nReturn volumes for specified times, based on anaytic solutions to the classical Bertalanffy model for lesion growth. Here p will have properties v0, v∞, ω, where v0 is the volume at time times[1] and the other parameters are explained in the TumorGrowth.bertalanffy_ode document string.\n\nThis is the λ=1/3 case of the bertalanffy model.\n\nSee also bertalanffy, bertalanffy2.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.compare-Tuple","page":"Reference","title":"TumorGrowth.compare","text":"compare(times, volumes, models; holdouts=3, metric=mae, advanced_options...)\n\nBy calibrating models using the specified patient times and lesion volumes, compare those models using a hold-out set consisting of the last holdouts data points.\n\ntimes = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\nvolumes = [0.00023, 8.4e-5, 6.1e-5, 4.3e-5, 4.3e-5, 4.3e-5]\n\njulia> comparison = compare(times, volumes, [gompertz, logistic])\nModelComparison with 3 holdouts:\n  metric: mae\n  gompertz:     2.198e-6\n  logistic:     6.55e-6\n\njulia> errors(comparison)\n2-element Vector{Float64}:\n 2.197843662660861e-6\n 6.549858321487298e-6\n\njulia> p = parameters(comparison)[1]  # calibrated parameter for `gompertz`\n(v0 = 0.00022643603114569068, v∞ = 3.8453274218216947e-5, ω = 0.11537512108224635)\n\njulia> gompertz(times, p)\n6-element Vector{Float64}:\n 0.00022643603114569068\n 9.435316392754094e-5\n 5.1039159299783234e-5\n 4.303209015899451e-5\n 4.021112910411027e-5\n 3.922743006690166e-5\n\nVisualing comparisons\n\nusing Plots\nplot(comparison, title=\"A comparison of two models\")\n\nKeyword options\n\nholdouts=3: number of time-volume pairs excluded from the end of the calibration data\nmetric=mae: metric applied to holdout set; the reported error on a model predicting volumes v̂ is metric(v̂, v) where v is the last holdouts values of volumes. For example, any regression measure from StatisticalMeasures.jl can be used here. The built-in fallback is mean absolute error.\nn_iterations=TumorGrowth.n_iterations.(models): a vector of iteration counts for the calibration of models\noptions=TumorGrowth.options.(models): a vector of named tuples providing the keyword arguments for CalibrationProblems - one for each model. See CalibrationProblem for details.\n\nSee also errors, parameters.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.curvature-Union{Tuple{T}, Tuple{AbstractArray{T}, Any}} where T","page":"Reference","title":"TumorGrowth.curvature","text":"curvature(xs, ys)\n\nReturn the coefficient a for the parabola x -> a*x^2 + b*x + c of best fit, for ordinates xs and coordinates ys.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.errors-Tuple{ModelComparison}","page":"Reference","title":"TumorGrowth.errors","text":"errors(comparison)\n\nExtract the the vector of errors from a ModelComparison object, as returned by calls to compare.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.flat_patient_data-Tuple{}","page":"Reference","title":"TumorGrowth.flat_patient_data","text":"flat_patient_data()\n\nReturn, in row table form, the lesion measurement data collected in Laleh et al. (2022) \"Classical mathematical models for prediction of response to chemotherapy and immunotherapy\", PLOS Computational Biology.\n\nEach row represents a single measurement of a single lesion on some day.\n\nSee also patient_data, in which each row represents all measurements of a single lesion.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.gompertz-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.gompertz","text":"gompertz(times, p)\n\nReturn volumes for specified times, based on anaytic solutions to the classical Gompertz model for lesion growth. Here p will have properties v0, v∞, ω, where v0 is the volume at time times[1] and the other parameters are explained in the TumorGrowth.bertalanffy_ode document string.\n\nThis is the λ=0 case of the bertalanffy model.\n\nSee also bertalanffy, bertalanffy2.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.logistic-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.logistic","text":"logistic(times, v0, v∞, ω)\n\nReturn volumes for specified times, based on anaytic solutions to the classical logistic (Verhulst) model for lesion growth. Here p will have properties v0, v∞, ω, where v0 is the volume at time times[1] and the other parameters are explained in the TumorGrowth.bertalanffy_ode document string.\n\nThis is the λ=-1 case of the bertalanffy model.\n\nSee also bertalanffy, bertalanffy2.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.loss-Tuple","page":"Reference","title":"TumorGrowth.loss","text":"loss(problem)\n\nReturn the sum of squares loss for a calibration problem, as constructed with CalibrationProblem.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.neural2-Tuple","page":"Reference","title":"TumorGrowth.neural2","text":"neural2([rng,] network)\n\nInitialize the Lux.jl neural2 network, network, and return a callable object, model, for solving the associated neural2 ODE for volume growth, as detailed under \"The ODE\" below.\n\nimportant: Important\nHere network must accept two inputs and deliver two outputs. For purposes of calibration, it may be helpful to use zero-initialization for the first layer. See the example below.\n\nThe returned object model is called like this:\n\nvolumes = model(times, p)\n\nwhere p should have properties v0, v∞, θ, where v0 is the initial volume (so that first(volumes) = v0), v∞ is a volume scale parameter, and θ is a network-compatible Lux.jl parameter.\n\nThe form of θ is the same as TumorGrowth.initial_parameters(model), which is also the default initial value used when solving an associated CalibrationProblem.\n\nusing Lux, Random\n\n# define neural2 network with 2 inputs and 2 outputs:\nnetwork = Lux.Chain(Dense(2, 3, Lux.tanh; init_weight=Lux.zeros64), Dense(3, 2))\n\nrng = Xoshiro(123)\nmodel = neural2(rng, network)\nθ = TumorGrowth.initial_parameters(model)\ntimes = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\nv0, v∞ = 0.00023, 0.00015\np = (; v0, v∞, θ)\n\njulia> volumes = model(times, p) # (constant because of zero-initialization)\n6-element Vector{Float64}:\n 0.00023\n 0.00023\n 0.00023\n 0.00023\n 0.00023\n 0.00023\n\nThe ODE\n\n...\n\nSee also TumorGrowth.neural_ode.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.neural_ode-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.neural_ode","text":"neural_ode([rng,] network)\n\nInitialize the Lux.jl neural2 network, network, and return an associated ODE, ode, with calling syntax dX_dt = ode(X, p, t), where p is a network-compatible parameter.\n\nThe initialized parameter value can be recovered with TumorGrowth.initial_parameters(ode). Get the network state with TumorGrowth.state(ode).\n\nusing Lux\nusing Random\n\nrng = Xoshiro(123)\nnetwork = network = Lux.Chain(Lux.Dense(2, 3, Lux.tanh), Lux.Dense(3, 2))\node = neural_ode(rng, network)\nθ = TumorGrowth.initial_parameters(ode)\node(rand(2), θ, 42.9) # last argument irrelevant as `ode` is autonomous\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.parameters-Tuple{ModelComparison}","page":"Reference","title":"TumorGrowth.parameters","text":"errors(comparison)\n\nExtract the the vector of errors from a ModelComparison object, as returned by calls to compare.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.patient_data-Tuple{}","page":"Reference","title":"TumorGrowth.patient_data","text":"patient_data()\n\nReturn, in row table form, the lesion measurement data collected in Laleh et al. (2022) \"Classical mathematical models for prediction of response to chemotherapy and immunotherapy\", PLOS Computational Biology.\n\nEach row represents all measurements for a single lesion for a unique patient.\n\nrecord = first(patient_data())\n\njulia> record.Pt_hashID # patient identifier\n\"0218075314855e6ceacca856fcd4c737-S1\"\n\njulia> record.T_weeks # measure times, in weeks\n7-element Vector{Float64}:\n  0.1\n  6.0\n 12.0\n 17.0\n 23.0\n 29.0\n 35.0\n\njulia> record.Lesion_normvol # all volumes measured, normalised by dataset max\n7-element Vector{Float64}:\n 0.000185364052636979\n 0.00011229838600811\n 8.4371439525252e-5\n 8.4371439525252e-5\n 1.05464299406565e-5\n 2.89394037571615e-5\n 8.4371439525252e-5\n\nSee also flat_patient_data.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.recover-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.recover","text":"recover(tuple, from)\n\nPrivate method.\n\nReturn a new tuple by replacing any nothing values with the corresponding value in the from tuple, whenever a corresponding key exists, and otherwise not make the replacement.\n\njulia> recover((x=1, y=nothing, z=3, w=nothing), (x=10, y=2, k=7))\n(x = 1, y = 2, z = 3, w = nothing)\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.slope-Union{Tuple{T}, Tuple{AbstractArray{T}, Any}} where T","page":"Reference","title":"TumorGrowth.slope","text":"slope(xs, ys)\n\nReturn the slope of the line of least-squares best fit for ordinates xs and coordinates ys.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.solution-Tuple{CalibrationProblem}","page":"Reference","title":"TumorGrowth.solution","text":"solution(problem)\n\nReturn to the solution to a CalibrationProblem. Normally applied after calling solve!(problem).\n\nAlso returns the solution to internally defined problems, as constructed with TumorGrowth.OptimisationProblem, TumorGrowth.CurveOptimisationProblem.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.solve!-Tuple","page":"Reference","title":"TumorGrowth.solve!","text":"solve!(problem, n)\n\nSolve a calibration problem, as constructed with CalibrationProblem. The calibrated parameters are then returned by solution(problem).\n\n\n\nsolve!(problem, controls...)\n\nSolve a calibration problem using one or more iteration controls, from the package IterationControls.jl. See the \"Extended help\" section of CalibrationProblem for examples.\n\n\n\n\n\n","category":"method"},{"location":"#Overview","page":"Overview","title":"Overview","text":"","category":"section"},{"location":"","page":"Overview","title":"Overview","text":"TumorGrowth.jl provides the following models (ODE solvers) for tumor growth:","category":"page"},{"location":"","page":"Overview","title":"Overview","text":"model description parameters, p analytic? ODE\nbertalanffy generalized Bertalanffy (GB) (; v0, v∞, ω, λ) yes TumorGrowth.bertalanffy_ode\nbertalanffy_numerical generalized Bertalanffy (testing only) (; v0, v∞, ω, λ) no TumorGrowth.bertalanffy_ode\nbertalanffy2 2D extension of generalized Bertalanffy (; v0, v∞, ω, λ, γ) no TumorGrowth.bertalanffy2_ode!\ngompertz Gompertz (GB, λ=0) (; v0, v∞, ω) yes TumorGrowth.bertalanffy_ode\nlogistic logistic/Verhulst (GB, λ=-1) (; v0, v∞, ω) yes TumorGrowth.bertalanffy_ode\nclassical_bertalanffy classical Bertalanffy (GB, λ=1/3) (; v0, v∞, ω) yes TumorGrowth.bertalanffy_ode\nneural2(rng, network) neural2 ODE with Lux.jl network (; v0, v∞, θ) no TumorGrowth.neural_ode","category":"page"},{"location":"","page":"Overview","title":"Overview","text":"The models predict a sequence of lesion volumes, given times and parameters:","category":"page"},{"location":"","page":"Overview","title":"Overview","text":"using TumorGrowth\n\ntimes = times = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\np = (v0=0.0002261, v∞=2.792e-5,  ω=0.05731) # `v0` is the initial volume\ngompertz(times, p)","category":"page"},{"location":"","page":"Overview","title":"Overview","text":"The underlying ODEs are solved under the hood, if an analytic solution is not known.","category":"page"},{"location":"","page":"Overview","title":"Overview","text":"TumorGrowth.jl also provides a CalibrationProblem tool to calibrate model parameters, given a history of measurements, and a compare tool to compare models on a holdout set.","category":"page"}]
}