var documenterSearchIndex = {"docs":
[{"location":"quick_start/#Quick-start","page":"Quick start","title":"Quick start","text":"","category":"section"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"First, let's grab some real clinical data collected in the study, Laleh et al. (2022) \"Classical mathematical models for prediction of response to chemotherapy and immunotherapy\", PLOS Computational Biology\":","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"using TumorGrowth\n\nrecords = patient_data();\nrecord = records[16]   # storing all measurements for one lesion\nkeys(record)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"Next, we calibrate the generalized Bertalanffy model using this particular patient record:","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"times = record.T_weeks\nvolumes = record.Lesion_normvol  # volumes normalized by max over dataset\n\nproblem = CalibrationProblem(times, volumes, bertalanffy)\nsolve!(problem, 2000)  # apply 2000 iterations of the calibration algorithm\np = solution(problem)\npretty(p)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"For advanced  options, see CalibrationProblem.","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"We can visualize the outcome and make predictions for an extended time period:","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"using Plots\nplot(problem)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"(Image: )","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"extended_times = vcat(times, [46.0, 53.1])\nbertalanffy(extended_times, p)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"And compare several models on a holdout set:","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"comparison = compare(times, volumes, [bertalanffy, logistic, bertalanffy2], holdouts=2)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"plot(comparison)","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"(Image: )","category":"page"},{"location":"quick_start/","page":"Quick start","title":"Quick start","text":"See compare for more options.","category":"page"},{"location":"reference/#Reference","page":"Reference","title":"Reference","text":"","category":"section"},{"location":"reference/","page":"Reference","title":"Reference","text":"Pages   = [\"reference.md\"]","category":"page"},{"location":"reference/","page":"Reference","title":"Reference","text":"Modules = [TumorGrowth,]\nPrivate = false\nOrder = [:constant, :type, :function, :macro, :module]","category":"page"},{"location":"reference/#TumorGrowth.CalibrationProblem-Tuple{Any, Any, Any}","page":"Reference","title":"TumorGrowth.CalibrationProblem","text":"    CalibrationProblem(times, volumes, model; learning_rate=0.0001, options...)\n\nSpecify a problem concerned with optimizing the parameters of a tumor growth model, given measured volumes and corresponding times.\n\nSee TumorGrowth for a list of possible models.\n\nDefault optimisation is by Adam gradient descent, using a sum of squares loss. Call solve! on a problem to carry out optimisation, as shown in the example below. See \"Extended Help\" for advanced options, including early stopping.\n\nInitial values of the parameters are inferred by default.\n\nUnless frozen (see \"Extended help\" below), the calibration process learns an initial condition v0 which is generally different from volumes[1].\n\nSimple solve\n\nusing TumorGrowth\n\ntimes = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\nvolumes = [0.00023, 8.4e-5, 6.1e-5, 4.3e-5, 4.3e-5, 4.3e-5]\nproblem = CalibrationProblem(times, volumes, gompertz; learning_rate=0.01)\nsolve!(problem, 30)    # apply 30 gradient descent updates\njulia> loss(problem)   # sum of squares loss\n1.7341026729860452e-9\n\np = solution(problem)\njulia> pretty(p)\n\"v0=0.0002261  v∞=2.792e-5  ω=0.05731\"\n\n\nextended_times = vcat(times, [42.0, 46.0])\njulia> gompertz(extended_times, p)[[7, 8]]\n2-element Vector{Float64}:\n 3.374100207406809e-5\n 3.245628908921241e-5\n\nExtended help\n\nSolving with iteration controls\n\nContinuing the example above, we may replace the number of iterations, n, in solve!(problem, n), with any control from IterationControl.jl:\n\nusing IterationControl\nsolve!(\n  problem,\n  Step(1),            # apply controls every 1 iteration...\n  WithLossDo(),       # print loss\n  Callback(problem -> print(pretty(solution(problem)))), # print parameters\n  InvalidValue(),     # stop for ±Inf/NaN loss, incl. case of out-of-bound parameters\n  NumberSinceBest(5), # stop when lowest loss so far was 5 steps prior\n  TimeLimit(1/60),    # stop after one minute\n  NumberLimit(400),   # stop after 400 steps\n)\np = solution(problem)\njulia> loss(problem)\n7.609310030658547e-10\n\nSee IterationControl.jl for all options.\n\nVisualizing results\n\nusing Plots\nscatter(times, volumes, xlab=\"time\", ylab=\"volume\", label=\"train\")\nplot!(problem, label=\"prediction\")\n\nKeyword options\n\np0: initial value of the model parameters; inferred by default for built-in models\ng=(p-> true): constraint function: If g(p) == false for some parameter p, then a warning is given and solution(problem) is frozen at the last constrained value of p; use solve!(problem, Step(1), InvalidValue(), ...) to ensure early stopping (which works because IterationControl.loss(problem) will return Inf in that case). If unspecified, the constraint function is inferred in the case of built-in models and parameters are otherwise unconstrained.\nfrozen: a named tuple, such as (; v0=nothing, λ=1/2); indicating parameters to be frozen at specified values during optimization; a nothing value means freeze at initial value.\nlearning_rate=0.0001: learning rate for Adam gradient descent optimiser\noptimiser=Optimisers.Adam(learning_rate): optimiser; must be from Optimisers.jl.\nscale: a scaling function with the property that p = scale(q) has a value of the same order of magnitude for the model parameters being optimised, whenever q has the same form as a model parameter p but with all values equal to one. Scaling ensures gradient descent learns all components of p at a similar rate. If unspecified, scaling is inferred for built-in models, and uniform otherwise.\nhalf_life=Inf: set to a real positive number to replace the sum of squares loss with a weighted version; weights decay in reverse time with the specified half_life\npenalty=0.0 (range=0 )): the larger the positive value, the more a loss function modification discourages large differences in v0 and v∞ on a log scale. Helps discourage v0 and v∞ drifting out of bounds in models whose ODE have a singularity at the origin.\node_options...: optional keyword arguments for the ODE solver, DifferentialEquations.solve, from DifferentialEquations.jl. Not relevant for models using analytic solutions (see the table at TumorGrowth.y\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.CalibrationProblem-Tuple{CalibrationProblem}","page":"Reference","title":"TumorGrowth.CalibrationProblem","text":"CalibrationProblem(problem; kwargs...)\n\nConstruct a new calibration problem out an existing problem but supply new keyword arguments, kwargs. Unspecified keyword arguments fall back to defaults, except for p0, which falls back to solution(problem).\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy","text":"bertalanffy(times, p)\n\nReturn volumes for specified times, based on the analytic solution to the generalized Bertalanffy model for lesion growth.  Here p will have properties v0, v∞, ω, λ, where v0 is the volume at time times[1]. Other parameters are explained below.\n\nSpecial cases of the model are:\n\nlogistic (λ = -1)\nclassical_bertalanffy  (λ = 1/3)\ngompertz (λ = 0)\n\nUnderlying ODE\n\nIn the generalized Bertalanffy model, the volume v  0 evolves according to the differential equation\n\ndvdt = ω B_λ(v_v) v\n\nwhere B_λ is the Box-Cox transformation, defined by B_λ(x) = (x^λ - 1)λ, unless λ = 0, in which case, B_λ(x) = log(x). Here:\n\nv_=v∞ is the steady state solution, stable and unique, assuming ω   0; this is sometimes referred to as the carrying capacity\n1ω has the  units of time\nλ is dimensionless\n\nFor a list of all models see TumorGrowth. \n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy2-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy2","text":"bertalanffy2(times, p; capacity=false, solve_kwargs...)\n\nReturn volumes for specified times, based on numerical solutions to a two-dimensional extension of generalized Bertalanffy model for lesion growth. Here p will have properties v0, v∞, ω, λ, γ, where v0 is the volume at time times[1].\n\nThe usual generalized Bertalanffy model is recovered when γ=0. In that case, using bertalanffy, which is based on an analytic solution, may be preferred. Other parameters are explained below.\n\nKeyword options\n\ncapacity=false: Set to true to return the latent \"carrying capacity\" variable, in addition to the actual volumes.\nsolve_kwargs: optional keyword arguments for the ODE solver, DifferentialEquations.solve, from DifferentialEquations.jl.\n\nUnderlying ODE\n\nIn this model the carrying capacity of the bertalanffy model, ordinarily fixed, is introduced as a new latent variable u(t), which is allowed to evolve independently of the volume v(t), at a rate in proportion to its magnitude:\n\ndvdt = ω B_λ(uv) v\n\ndudt = γωu\n\nHere B_λ is the Box-Cox transformation with exponent λ. See bertalanffy. Also:\n\n1ω has units of time\nλ is dimensionless\nγ is dimensionless\n\nSince u is a latent variable, its initial value, v∞ ≡ u(times[1]), is an additional model parameter.\n\nFor a list of all models see TumorGrowth. \n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy_numerical-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy_numerical","text":"bertalanffy_numerical(times, p; solve_kwargs...)\n\nProvided for testing purposes.\n\nReturn volumes for specified times, based on numerical solutions to the generalized Bertalanffy model for lesion growth. Here p will have properties v0, v∞, ω, λ, where v0 is the volume at time times[1]; solve_kwargs are optional keyword arguments for the ODE solver, DifferentialEquations.solve, from DifferentialEquations.jl.\n\nSince it is based on analtic solutions, bertalanffy is the preferred alternative to this function.\n\nimportant: Important\nIt is assumed without checking that times is ordered: times == sort(times).\n\nSee also bertalanffy2.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.classical_bertalanffy-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.classical_bertalanffy","text":"classical_bertalanffy(times, v0, v∞, ω)\n\nReturn volumes for specified times, based on anaytic solutions to the classical Bertalanffy model for lesion growth. Here p will have properties v0, v∞, ω, where v0 is the volume at time times[1].\n\nThis is the λ=1/3 case of the bertalanffy model.\n\nFor a list of all models see TumorGrowth. \n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.compare-Tuple","page":"Reference","title":"TumorGrowth.compare","text":"compare(times, volumes, models; holdouts=3, metric=mae, advanced_options...)\n\nBy calibrating models using the specified patient times and lesion volumes, compare those models using a hold-out set consisting of the last holdouts data points.\n\ntimes = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\nvolumes = [0.00023, 8.4e-5, 6.1e-5, 4.3e-5, 4.3e-5, 4.3e-5]\n\njulia> comparison = compare(times, volumes, [gompertz, logistic])\nModelComparison with 3 holdouts:\n  metric: mae\n  gompertz:     2.198e-6\n  logistic:     6.55e-6\n\njulia> errors(comparison)\n2-element Vector{Float64}:\n 2.197843662660861e-6\n 6.549858321487298e-6\n\njulia> p = parameters(comparison)[1]  # calibrated parameter for `gompertz`\n(v0 = 0.00022643603114569068, v∞ = 3.8453274218216947e-5, ω = 0.11537512108224635)\n\njulia> gompertz(times, p)\n6-element Vector{Float64}:\n 0.00022643603114569068\n 9.435316392754094e-5\n 5.1039159299783234e-5\n 4.303209015899451e-5\n 4.021112910411027e-5\n 3.922743006690166e-5\n\nWhen a model parameter becomes out of bounds, calibration stops early and the last in-bounds value is reported.\n\nVisualing comparisons\n\nusing Plots\nplot(comparison, title=\"A comparison of two models\")\n\nKeyword options\n\nholdouts=3: number of time-volume pairs excluded from the end of the calibration data\nmetric=mae: metric applied to holdout set; the reported error on a model predicting volumes v̂ is metric(v̂, v) where v is the last holdouts values of volumes. For example, any regression measure from StatisticalMeasures.jl can be used here. The built-in fallback is mean absolute error.\nn_iterations=TumorGrowth.n_iterations.(models): a vector of iteration counts for the calibration of models\ncalibration_options=TumorGrowth.options.(models): a vector of named tuples providing the keyword arguments for CalibrationProblems - one for each model. See CalibrationProblem for details.\nflag_out_of_bounds=false: set to true to report NaN as the error for a model whose parameter became out of bounds during calibration. Otherwise, the error for the last in-bounds parameter is reported.\n\nSee also errors, parameters.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.errors-Tuple{ModelComparison}","page":"Reference","title":"TumorGrowth.errors","text":"errors(comparison)\n\nExtract the the vector of errors from a ModelComparison object, as returned by calls to compare.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.flat_patient_data-Tuple{}","page":"Reference","title":"TumorGrowth.flat_patient_data","text":"flat_patient_data()\n\nReturn, in row table form, the lesion measurement data collected in Laleh et al. (2022) \"Classical mathematical models for prediction of response to chemotherapy and immunotherapy\", PLOS Computational Biology.\n\nEach row represents a single measurement of a single lesion on some day.\n\nSee also patient_data, in which each row represents all measurements of a single lesion.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.gompertz-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.gompertz","text":"gompertz(times, p)\n\nReturn volumes for specified times, based on anaytic solutions to the classical Gompertz model for lesion growth. Here p will have properties v0, v∞, ω, where v0 is the volume at time times[1].\n\nThis is the λ=0 case of the bertalanffy model.\n\nFor a list of all models see TumorGrowth. \n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.guess_parameters-Tuple{Any, Any, Any}","page":"Reference","title":"TumorGrowth.guess_parameters","text":"guess_parameters(times, volumes, model)\n\nApply heuristics to guess parameters p for a model.\n\nNew model implementations\n\nFallback returns nothing which will prompt user's to explicitly specify initial parameter values in calibration problems.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.logistic-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.logistic","text":"logistic(times, v0, v∞, ω)\n\nReturn volumes for specified times, based on anaytic solutions to the classical logistic (Verhulst) model for lesion growth. Here p will have properties v0, v∞, ω, where v0 is the volume at time times[1].\n\nThis is the λ=-1 case of the bertalanffy model.\n\nFor a list of all models see TumorGrowth. \n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.loss-Tuple","page":"Reference","title":"TumorGrowth.loss","text":"loss(problem)\n\nReturn the sum of squares loss for a calibration problem, as constructed with CalibrationProblem.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.neural-Tuple","page":"Reference","title":"TumorGrowth.neural","text":"neural([rng,] network; transform=log, inverse=exp)\n\nInitialize the Lux.jl neural network, network, and return a callable object, model, for solving the associated one-dimensional neural ODE for volume growth, as detailed under \"Underlying ODE\" below.\n\nThe returned object, model, is called like this:\n\nvolumes = model(times, p)\n\nwhere p should have properties v0, v∞, θ, where v0 is the initial volume (so that volumes[1] = v0), v∞ is a volume scale parameter, and θ is a network-compatible Lux.jl parameter.\n\nIt seems that calibration works best if v∞ is frozen.\n\nThe form of θ is the same as TumorGrowth.initial_parameters(model), which is also the default initial value used when solving an associated CalibrationProblem.\n\nusing Lux, Random\n\n# define neural network with 1 input and 1 output:\nnetwork = Lux.Chain(Dense(1, 3, Lux.tanh; init_weight=Lux.zeros64), Dense(3, 1))\n\nrng = Xoshiro(123)\nmodel = neural(rng, network)\nθ = TumorGrowth.initial_parameters(model)\ntimes = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\nv0, v∞ = 0.00023, 0.00015\np = (; v0, v∞, θ)\n\njulia> volumes = model(times, p) # (constant because of zero-initialization)\n6-element Vector{Float64}:\n 0.00023\n 0.00023\n 0.00023\n 0.00023# # Neural2\n\nUnderlying ODE\n\nView the neural network (with fixed parameter θ) as a mathematical function f and write ϕ for the transform function. Then v(t) = v_ ϕ^-1(y(t)), where y(t) evolves according to\n\ndydt = f(y)\n\nsubject to the initial condition y(t₀) = ϕ(v_0v_), where t₀ is the initial time, times[1]. We are writing v₀=v0 and v_=v∞.\n\nFor a list of all models see TumorGrowth.  See also CalibrationProblem.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.neural2-Tuple","page":"Reference","title":"TumorGrowth.neural2","text":"neural2([rng,] network; transform=log, inverse=exp)\n\nInitialize the Lux.jl neural network, network, and return a callable object, model, for solving the associated two-dimensional neural2 ODE for volume growth, as detailed under \"Underlying ODE\" below.\n\nThe returned object model is called like this:\n\nvolumes = model(times, p)\n\nwhere p should have properties v0, v∞, θ, where v0 is the initial volume (so that volumes[1] = v0), v∞ is a volume scale parameter, and θ is a network-compatible Lux.jl parameter.\n\nIt seems that calibration works best if v∞ is frozen.\n\nThe form of θ is the same as TumorGrowth.initial_parameters(model), which is also the default initial value used when solving an associated CalibrationProblem.\n\nusing Lux, Random\n\n# define neural network with 2 inputs and 2 outputs:\nnetwork = Lux.Chain(Dense(2, 3, Lux.tanh; init_weight=Lux.zeros64), Dense(3, 2))\n\nrng = Xoshiro(123)\nmodel = neural2(rng, network)\nθ = TumorGrowth.initial_parameters(model)\ntimes = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\nv0, v∞ = 0.00023, 0.00015\np = (; v0, v∞, θ)\n\njulia> volumes = model(times, p) # (constant because of zero-initialization)\n6-element Vector{Float64}:\n 0.00023\n 0.00023\n 0.00023\n 0.00023\n 0.00023\n 0.00023\n\nUnderlying ODE\n\nView the neural network (with fixed parameter θ) as a mathematical function f, with components f₁ and f₂, and write ϕ for the transform function. Then v(t) = v_ ϕ^-1(y(t)), where y(t), and a latent variable u(t), evolve according to\n\ndydt = f₁(y u)\n\ndudt = f₂(y u)\n\nsubject to the initial conditions y(t₀) = ϕ(v₀v_), u(t₀) = 1, where t₀ is the initial time, times[1]. We are writing v₀=v0 and v_=v∞.\n\nFor a list of all models see TumorGrowth.  See also CalibrationProblem.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.parameters-Tuple{ModelComparison}","page":"Reference","title":"TumorGrowth.parameters","text":"errors(comparison)\n\nExtract the the vector of errors from a ModelComparison object, as returned by calls to compare.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.patient_data-Tuple{}","page":"Reference","title":"TumorGrowth.patient_data","text":"patient_data()\n\nReturn, in row table form, the lesion measurement data collected in Laleh et al. (2022) \"Classical mathematical models for prediction of response to chemotherapy and immunotherapy\", PLOS Computational Biology.\n\nEach row represents all measurements for a single lesion for a unique patient.\n\nrecord = first(patient_data())\n\njulia> record.Pt_hashID # patient identifier\n\"0218075314855e6ceacca856fcd4c737-S1\"\n\njulia> record.T_weeks # measure times, in weeks\n7-element Vector{Float64}:\n  0.1\n  6.0\n 12.0\n 17.0\n 23.0\n 29.0\n 35.0\n\njulia> record.Lesion_normvol # all volumes measured, normalised by dataset max\n7-element Vector{Float64}:\n 0.000185364052636979\n 0.00011229838600811\n 8.4371439525252e-5\n 8.4371439525252e-5\n 1.05464299406565e-5\n 2.89394037571615e-5\n 8.4371439525252e-5\n\nSee also flat_patient_data.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.solution-Tuple{CalibrationProblem}","page":"Reference","title":"TumorGrowth.solution","text":"solution(problem)\n\nReturn to the solution to a CalibrationProblem. Normally applied after calling solve!(problem).\n\nAlso returns the solution to internally defined problems, as constructed with TumorGrowth.OptimisationProblem, TumorGrowth.CurveOptimisationProblem.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.solve!-Tuple","page":"Reference","title":"TumorGrowth.solve!","text":"solve!(problem, n)\n\nSolve a calibration problem, as constructed with CalibrationProblem. The calibrated parameters are then returned by solution(problem).\n\n\n\nsolve!(problem, controls...)\n\nSolve a calibration problem using one or more iteration controls, from the package IterationControls.jl. See the \"Extended help\" section of CalibrationProblem for examples.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.TumorGrowth","page":"Reference","title":"TumorGrowth.TumorGrowth","text":"TumorGrowth.jl provides the following models for tumor growth: \n\nmodel description parameters, p analytic?\nbertalanffy generalized Bertalanffy (GB) (; v0, v∞, ω, λ) yes\nbertalanffy_numerical generalized Bertalanffy (testing only) (; v0, v∞, ω, λ) no\nbertalanffy2 2D extension of generalized Bertalanffy (; v0, v∞, ω, λ, γ) no\ngompertz Gompertz (GB, λ=0) (; v0, v∞, ω) yes\nlogistic logistic/Verhulst (GB, λ=-1) (; v0, v∞, ω) yes\nclassical_bertalanffy classical Bertalanffy (GB, λ=1/3) (; v0, v∞, ω) yes\nneural(rng, network) 1D neural ODE with Lux.jl network (; v0, v∞, θ) no\nneural2(rng, network) 2D neural ODE with Lux.jl network (; v0, v∞, θ) no\n\nHere a model is a callable object, that outputs a sequence of lesion volumes, given times, by solving a related ordinary differential equation with parameters (p below):\n\nusing TumorGrowth\n\ntimes = times = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\np = (v0=0.0002261, v∞=2.792e-5,  ω=0.05731) # `v0` is the initial volume\nvolumes = gompertz(times, p)\n6-element Vector{Float64}:\n 0.0002261\n 0.0001240760197801191\n 6.473115210101774e-5\n 4.751268597529182e-5\n 3.9074807723757934e-5\n 3.496675045077041e-5\n\nIn every model, v0 is the initial volume, so that volumes[1] == v0.\n\nIn the case analytic solutions to the underlying ODEs are not known, optional keyword arguments for the DifferentialEquations.jl solver can be passed to the model call.\n\nTumorGrowth.jl also provides a CalibrationProblem tool to calibrate model parameters, and a compare tool to compare models on a holdout set.\n\nCalibration is performed using a gradient descent optimiser to minimise a (possibly weighted) least-squares error on provided clinical measurements, and uses the adjoint method to auto-differentiate solutions to the underlying ODE's, with respect to the ODE parameters, and initial conditions to be optimised.\n\n\n\n\n\n","category":"module"},{"location":"reference/","page":"Reference","title":"Reference","text":"Modules = [TumorGrowth,]\nPublic = false\nOrder = [:constant, :type, :function, :macro, :module]","category":"page"},{"location":"reference/#TumorGrowth.WeightedL2Loss","page":"Reference","title":"TumorGrowth.WeightedL2Loss","text":"WeightedL2Loss(times, h=Inf)\n\nPrivate method.\n\nReturn a weighted sum of squares loss function (ŷ, y) -> loss, where the weights decay in reverse time with a half life h.\n\n\n\n\n\n","category":"type"},{"location":"reference/#TumorGrowth.bertalanffy2_ode!-NTuple{4, Any}","page":"Reference","title":"TumorGrowth.bertalanffy2_ode!","text":"bertalanffy2_ode!(dX, X, p, t)\n\nA two-dimensional extension of the ODE describing the generalized Bertalanffy model for lesion growth.  Here X = [v, u], where v is volume at time t and u is the \"carrying capacity\" at time t, a latent variable. The time derivatives are written to dX. For the specific form of the ODE, see bertalanffy2.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.bertalanffy_ode-Tuple{Any, Any, Any}","page":"Reference","title":"TumorGrowth.bertalanffy_ode","text":"bertalanffy_ode(v, p, t)\n\nBased on the generalized Bertalanffy model, return the rate in change in volume at time t, for a current volume of v. For details, see bertalanffy.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.constraint_function-Tuple{Any}","page":"Reference","title":"TumorGrowth.constraint_function","text":"constraint_function(model)\n\nReturn an appropriate Bool-valued function p -> g(p) which is false whenever parameter p leaves the natural domain of model.\n\nNew model implementations\n\nFallback returns true always.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.curvature-Union{Tuple{T}, Tuple{AbstractArray{T}, Any}} where T","page":"Reference","title":"TumorGrowth.curvature","text":"curvature(xs, ys)\n\nReturn the coefficient a for the parabola x -> a*x^2 + b*x + c of best fit, for ordinates xs and coordinates ys.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.merge-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.merge","text":"TumorGrowth.merge(x, y::NamedTuple)\n\nPrivate method.\n\nOrdinary merge if x is also a named tuple. More generally, first deconstruct x using TumorGrowth.functor, merge as usual, and reconstruct.\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.n_iterations-Tuple{Any}","page":"Reference","title":"TumorGrowth.n_iterations","text":"n_iterations(model)\n\nDefault number of iterations to run calibration of model in model comparisons.\n\nNew model implementations\n\nFallback returns 10000\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.neural_ode-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.neural_ode","text":"neural_ode([rng,] network)\n\nInitialize the Lux.jl neural2 network, network, and return an associated ODE, ode, with calling syntax dX_dt = ode(X, p, t), where p is a network-compatible parameter.\n\nThe initialized parameter value can be recovered with TumorGrowth.initial_parameters(ode). Get the network state with TumorGrowth.state(ode).\n\nusing Lux\nusing Random\n\nrng = Xoshiro(123)\nnetwork = network = Lux.Chain(Lux.Dense(2, 3, Lux.tanh), Lux.Dense(3, 2))\node = neural_ode(rng, network)\nθ = TumorGrowth.initial_parameters(ode)\node(rand(2), θ, 42.9) # last argument irrelevant as `ode` is autonomous\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.options-Tuple{Any}","page":"Reference","title":"TumorGrowth.options","text":"options(model)\n\nDefault calibration options for model in model comparisons.\n\nNew model implementations\n\nFallback returns (learning_rate=0.0001, penalty=0.8)\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.recover-Tuple{Any, Any}","page":"Reference","title":"TumorGrowth.recover","text":"recover(tuple, from)\n\nPrivate method.\n\nReturn a new tuple by replacing any nothing values with the corresponding value in the from tuple, whenever a corresponding key exists, and otherwise ignore.\n\njulia> recover((x=1, y=nothing, z=3, w=nothing), (x=10, y=2, k=7))\n(x = 1, y = 2, z = 3, w = nothing)\n\n\n\n\n\n","category":"method"},{"location":"reference/#TumorGrowth.scale_function-Tuple{Any, Any, Any}","page":"Reference","title":"TumorGrowth.scale_function","text":"scale_function(times, volumes, model)\n\nReturn an appropriate function p -> f(p) so that p = f(q) has a value of the same order of magnitude expected for model parameters, whenever q has the same form as p but with all values equal to one.\n\nNew model implementations\n\nFallback returns the identity.\n\n\n\n\n\n","category":"method"},{"location":"#Overview","page":"Overview","title":"Overview","text":"","category":"section"},{"location":"","page":"Overview","title":"Overview","text":"TumorGrowth","category":"page"},{"location":"#TumorGrowth","page":"Overview","title":"TumorGrowth","text":"TumorGrowth.jl provides the following models for tumor growth: \n\nmodel description parameters, p analytic?\nbertalanffy generalized Bertalanffy (GB) (; v0, v∞, ω, λ) yes\nbertalanffy_numerical generalized Bertalanffy (testing only) (; v0, v∞, ω, λ) no\nbertalanffy2 2D extension of generalized Bertalanffy (; v0, v∞, ω, λ, γ) no\ngompertz Gompertz (GB, λ=0) (; v0, v∞, ω) yes\nlogistic logistic/Verhulst (GB, λ=-1) (; v0, v∞, ω) yes\nclassical_bertalanffy classical Bertalanffy (GB, λ=1/3) (; v0, v∞, ω) yes\nneural(rng, network) 1D neural ODE with Lux.jl network (; v0, v∞, θ) no\nneural2(rng, network) 2D neural ODE with Lux.jl network (; v0, v∞, θ) no\n\nHere a model is a callable object, that outputs a sequence of lesion volumes, given times, by solving a related ordinary differential equation with parameters (p below):\n\nusing TumorGrowth\n\ntimes = times = [0.1, 6.0, 16.0, 24.0, 32.0, 39.0]\np = (v0=0.0002261, v∞=2.792e-5,  ω=0.05731) # `v0` is the initial volume\nvolumes = gompertz(times, p)\n6-element Vector{Float64}:\n 0.0002261\n 0.0001240760197801191\n 6.473115210101774e-5\n 4.751268597529182e-5\n 3.9074807723757934e-5\n 3.496675045077041e-5\n\nIn every model, v0 is the initial volume, so that volumes[1] == v0.\n\nIn the case analytic solutions to the underlying ODEs are not known, optional keyword arguments for the DifferentialEquations.jl solver can be passed to the model call.\n\nTumorGrowth.jl also provides a CalibrationProblem tool to calibrate model parameters, and a compare tool to compare models on a holdout set.\n\nCalibration is performed using a gradient descent optimiser to minimise a (possibly weighted) least-squares error on provided clinical measurements, and uses the adjoint method to auto-differentiate solutions to the underlying ODE's, with respect to the ODE parameters, and initial conditions to be optimised.\n\n\n\n\n\n","category":"module"},{"location":"","page":"Overview","title":"Overview","text":"See Quick start for further details.","category":"page"}]
}
