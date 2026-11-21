import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Client-facing portal login + data fetch.
// Called by external clients (NOT platform users) with slug + email + password.
// Returns a fully sanitized payload — all INTERNAL ONLY fields are stripped server-side.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { slug, email, password } = await req.json();

    if (!slug || !email || !password) {
      return Response.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const clients = await svc.entities.PortalClient.filter({ portal_slug: slug });
    const client = clients[0];
    if (!client || client.is_active === false) {
      return Response.json({ error: 'Portal not found or inactive' }, { status: 404 });
    }
    if (
      (client.login_email || '').toLowerCase().trim() !== email.toLowerCase().trim() ||
      client.login_password !== password
    ) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const departments = await svc.entities.PortalDepartment.filter({ portal_client_id: client.id });

    const useCases = [];
    for (const d of departments) {
      const ucs = await svc.entities.PortalUseCase.filter({ department_id: d.id });
      useCases.push(...ucs);
    }

    const meetings = [];
    const owners = [];
    const forms = [];
    for (const uc of useCases) {
      const [m, o, f] = await Promise.all([
        svc.entities.PortalMeeting.filter({ use_case_id: uc.id }),
        svc.entities.PortalProcessOwner.filter({ use_case_id: uc.id }),
        svc.entities.PortalDiscoveryForm.filter({ use_case_id: uc.id }),
      ]);
      meetings.push(...m);
      // Only client-visible people; never decision makers
      owners.push(...o.filter(p => p.visibility !== 'Internal-only' && p.person_type !== 'Decision Maker'));
      forms.push(...f);
    }

    const dataSources = [];
    const steps = [];
    const exceptions = [];
    const escalations = [];
    const userGroups = [];
    for (const form of forms) {
      const [ds, st, ex, es, ug] = await Promise.all([
        svc.entities.PortalDataSource.filter({ form_id: form.id }),
        svc.entities.PortalProcessStep.filter({ form_id: form.id }),
        svc.entities.PortalException.filter({ form_id: form.id }),
        svc.entities.PortalEscalationMatrix.filter({ form_id: form.id }),
        svc.entities.PortalUserGroup.filter({ form_id: form.id }),
      ]);
      dataSources.push(...ds);
      steps.push(...st);
      exceptions.push(...ex);
      escalations.push(...es);
      userGroups.push(...ug);
    }

    // ── SANITIZE — strip every INTERNAL ONLY field ──
    const cleanUseCases = useCases.map(uc => ({
      id: uc.id,
      department_id: uc.department_id,
      process_name: uc.process_name,
      problem_statement: uc.problem_statement,
      solution_statement: uc.solution_statement,
      demo_link: uc.demo_link,
      automation_type: uc.automation_type,
      status: uc.status,
    }));

    const cleanForms = forms.map(f => ({
      id: f.id,
      use_case_id: f.use_case_id,
      time_per_cycle: f.time_per_cycle,
      frequency: f.frequency,
      volume_per_cycle: f.volume_per_cycle,
      people_involved: f.people_involved,
      error_rate: f.error_rate,
      seasonality: f.seasonality,
      trigger: f.trigger,
      infrastructure_overview: f.infrastructure_overview,
      workarounds: f.workarounds,
      goal_statement: f.goal_statement,
      desired_output_type: f.desired_output_type,
      desired_output: f.desired_output,
      desired_look: f.desired_look,
      must_haves: f.must_haves,
      nice_to_haves: f.nice_to_haves,
      success_metric: f.success_metric,
    }));

    const cleanSources = dataSources.map(s => ({
      id: s.id,
      form_id: s.form_id,
      source_name: s.source_name,
      owning_team: s.owning_team,
      system: s.system,
      format: s.format,
      structure: s.structure,
      data_cleanliness: s.data_cleanliness,
    }));

    return Response.json({
      client: {
        client_name: client.client_name,
        company_logo_url: client.company_logo_url || '',
        portal_slug: client.portal_slug,
      },
      departments,
      useCases: cleanUseCases,
      meetings,
      owners,
      forms: cleanForms,
      dataSources: cleanSources,
      steps,
      exceptions,
      escalations,
      userGroups,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});