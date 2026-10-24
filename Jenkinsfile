// ═══════════════════════════════════════════════════════════════════════════
// PLANTILLA GENÉRICA DE PIPELINE — Playwright + Allure
//
// Este Jenkinsfile está pensado para descargarse y reutilizarse en CUALQUIER
// proyecto de automatización de pruebas con Playwright. Todo lo que hay que
// adaptar a tu proyecto está marcado con 🔧 en la sección de CONFIGURACIÓN
// más abajo. El resto de la lógica (modos, detección de cambios, reportes)
// funciona "de fábrica" sin tocar nada más.
//
// COMPORTAMIENTO POR RAMA
//   ${FREE_MODE_BRANCH}   → Modo Libre: manual (formulario) + detección de
//                           cambios por push. También permite probar el
//                           Modo Despliegue manualmente (testing).
//   ${DEPLOY_ONLY_BRANCH} → SOLO Modo Despliegue. Sin ENVIRONMENTS+MODULES
//                           el build se marca NOT_BUILT (no corre nada).
//
// REQUISITOS EN JENKINS
//   • Plugin NodeJS con una instalación llamada igual que NODE_TOOL_NAME.
//   • Plugin Allure Jenkins (+ Allure Commandline en Manage Jenkins > Tools)
//     para publicar el reporte (stage 'post > always').
//   • Agente Windows (los pasos usan `powershell`). Si tu agente es
//     Linux/macOS, cambia los bloques `powershell` por `sh` y ajusta la
//     sintaxis de los scripts (rm -rf, mkdir -p, variables $VAR, etc.).
//   • env.BRANCH_NAME SOLO existe si el job es un Multibranch Pipeline (o
//     branch de un job Pipeline con "Discover branches"). En un job
//     "Pipeline script from SCM" apuntando a una sola rama, BRANCH_NAME es
//     null: el guard de rama nunca bloquea y todo corre en Modo Libre por
//     defecto — que es justo lo que quieres para un demo de una sola rama.
//   • Sin webhook público, usa pollSCM (ya configurado abajo) para que un
//     push dispare el build automáticamente. Si más adelante expones Jenkins
//     con una URL pública, cambia el trigger por githubPush().
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURACIÓN DEL PROYECTO — AJUSTA ESTA SECCIÓN A TU PROYECTO
// ═══════════════════════════════════════════════════════════════════════════

// Nombre de la rama que opera en Modo Libre (manual + detección de cambios).
FREE_MODE_BRANCH = 'develop'

// Nombre de la rama que SOLO admite Modo Despliegue (ver guard de rama).
DEPLOY_ONLY_BRANCH = 'main'

// Nombre exacto de la instalación NodeJS configurada en
// "Manage Jenkins > Tools > NodeJS installations".
NODE_TOOL_NAME = 'node20'

// Si quieres fijar este pipeline a un worker específico, descomenta la línea
// "agent { label ... }" más abajo (justo debajo del bloque pipeline) y
// comenta "agent any". Por defecto corre en cualquier agente disponible.

// Pon en true solo si tu aplicación requiere login y vas a configurar
// credenciales en Jenkins (ver resolveCredentialIds()/DEFAULT_USER_CRED/
// DEFAULT_PASS_CRED más abajo). En false, el pipeline corre sin credenciales.
USE_LOGIN_CREDENTIALS = false

// IDs de credenciales Jenkins (tipo "Secret text") usadas como fallback
// genérico cuando USE_LOGIN_CREDENTIALS = true y no existe una credencial
// específica para el ambiente (ver resolveCredentialIds()).
DEFAULT_USER_CRED = 'DEFAULT_USER'
DEFAULT_PASS_CRED = 'DEFAULT_PASS'

/**
 * 🔧 Modo Despliegue — AMBIENTES válidos y su URL base.
 * Rellena con los ambientes reales de tu proyecto. La clave es lo que el
 * usuario escribe en el parámetro ENVIRONMENTS (separado por comas).
 * Ejemplo:
 *   return [
 *       'dev'     : 'https://dev.tuapp.com/',
 *       'qa'      : 'https://qa.tuapp.com/',
 *       'staging' : 'https://staging.tuapp.com/',
 *   ]
 */
def getEnvironmentsMap() {
    return [
        // 'dev' : 'https://dev.tuapp.com/',
    ]
}

/**
 * 🔧 Modo Despliegue — MÓDULOS/funcionalidades válidos y su tag de Playwright.
 * La clave es lo que el usuario escribe en el parámetro MODULES; el valor es
 * el tag (sin '@') que usas en tus tests, ej: test('...', { tag: '@login' }).
 * Ejemplo:
 *   return [
 *       'LOGIN'    : 'login',
 *       'CHECKOUT' : 'checkout',
 *   ]
 */
def getModuleTagMap() {
    return [
        // 'LOGIN' : 'login',
    ]
}

/**
 * 🔧 Modo Libre — Detección de cambios: relaciona un módulo "amigable" con
 * la carpeta de specs que le corresponde dentro de tests/. Solo se usa para
 * decidir QUÉ correr cuando un push toca archivos de tests/. Déjalo vacío
 * si no necesitas esa granularidad (ver analyzeChanges: por defecto, un
 * spec suelto se ejecuta solo a sí mismo y todo lo demás corre la suite
 * completa por seguridad).
 * Ejemplo:
 *   return [
 *       'login'    : 'tests/login',
 *       'checkout' : 'tests/checkout',
 *   ]
 */
def getChangeDetectionModuleMap() {
    return [:]
}

// ═══════════════════════════════════════════════════════════════════════════

pipeline {
    agent any
    // agent { label 'tu-etiqueta-de-agente' } // 🔧 usa esta línea en vez de "agent any" para fijar un worker específico

    tools {
        nodejs NODE_TOOL_NAME
    }

    parameters {
        // ─── Modo Libre (solo tiene efecto en FREE_MODE_BRANCH) ───
        choice(
            name: 'TEST_SUITE',
            choices: ['auto', 'smoke', 'regression', 'all'],
            description: "[MODO LIBRE - ${FREE_MODE_BRANCH}] Suite a correr. \"auto\" decide según la rama."
        )
        string(
            name: 'MODULE',
            defaultValue: '',
            description: '[MODO LIBRE] Tag de módulo específico (ej: login). Vacío = todos.'
        )
        string(
            name: 'EXTRA_GREP',
            defaultValue: '',
            description: 'Patrón --grep adicional. Vacío si no aplica.'
        )
        string(
            name: 'APP_BASE_URL',
            // 🔧 Cambia este default por la URL de tu ambiente por defecto.
            defaultValue: 'https://example.com/',
            description: '[MODO LIBRE] URL base. En Modo Despliegue se reconstruye automáticamente por ambiente.'
        )
        booleanParam(
            name: 'FORCE_FULL_SUITE',
            defaultValue: false,
            description: "Forzar ejecución completa ignorando detección de cambios. Solo aplica en ${FREE_MODE_BRANCH}."
        )

        // ─── Modo Despliegue (única vía válida en DEPLOY_ONLY_BRANCH; también testeable en modo libre) ───
        string(
            name: 'ENVIRONMENTS',
            defaultValue: '',
            description: '[MODO DESPLIEGUE] Ambientes a probar, separados por coma. Ej: dev,qa'
        )
        string(
            name: 'MODULES',
            defaultValue: '',
            description: '[MODO DESPLIEGUE] Módulos/funcionalidades a probar, separados por coma. Ej: LOGIN,CHECKOUT'
        )
        string(
            name: 'VERSION',
            defaultValue: '',
            description: '[MODO DESPLIEGUE] Versión release (informativo). Ej: v1.4.0'
        )
        choice(
            name: 'TEST_TYPE',
            choices: ['e2e', 'smoke', 'regression', 'critical', 'all'],
            description: '[MODO DESPLIEGUE] Tipo de prueba a correr.'
        )
        choice(
            name: 'EXECUTION_MODE',
            choices: ['per_environment', 'all_environments_together'],
            description: '[MODO DESPLIEGUE] Una corrida por ambiente o todos juntos.'
        )
    }

    options {
        timeout(time: 90, unit: 'MINUTES')
        // ansiColor('xterm') // habilítalo si instalas el plugin AnsiColor
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
        timestamps()
        skipDefaultCheckout(true)
    }

    triggers {
        // 🔧 Sin webhook público (Jenkins local): revisa cambios cada 5 min.
        // Si configuras un webhook de GitHub, reemplaza esto por githubPush().
        pollSCM('H/5 * * * *')
    }

    environment {
        CI = 'true'
        PLAYWRIGHT_BROWSERS_PATH = "${WORKSPACE}/.cache/playwright-browsers"
        BASE_URL = "${params.APP_BASE_URL}" // Default para Modo Libre; Modo Despliegue lo sobreescribe por ambiente dentro del script
    }

    stages {

        stage('Limpiar Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('🔍 Información del Build') {
            steps {
                script {
                    def causes = currentBuild.getBuildCauses()
                    env.IS_MANUAL_BUILD = causes.any { it._class?.contains('UserIdCause') } ? 'true' : 'false'
                    env.IS_DEPLOY_ONLY_BRANCH = (env.BRANCH_NAME == DEPLOY_ONLY_BRANCH) ? 'true' : 'false'

                    def hasDeploymentParams = params.MODULES?.trim() && params.ENVIRONMENTS?.trim()
                    env.PIPELINE_MODE = hasDeploymentParams ? 'DEPLOYMENT' : 'FREE'

                    if (env.PIPELINE_MODE == 'DEPLOYMENT') {
                        def version         = params.VERSION?.trim()     ?: 'sin-version'
                        def modulos         = params.MODULES?.trim()     ?: 'sin-modulo'
                        def ambiente        = params.ENVIRONMENTS?.trim() ?: 'sin-ambiente'
                        def ambienteLabel   = ambiente.replace(',', '+')
                        currentBuild.displayName = "${version} | ${modulos} | ${ambienteLabel}"
                        currentBuild.description = "E2E — ${ambiente}"
                    }

                    echo '═══════════════════════════════════════════════════════════════'
                    echo '  INFORMACIÓN DEL BUILD'
                    echo '═══════════════════════════════════════════════════════════════'
                    echo "  📌 Build número:     #${env.BUILD_NUMBER}"
                    echo "  🏷  Nombre build:     ${currentBuild.displayName}"
                    echo "  🌿 Rama:             ${env.BRANCH_NAME ?: 'desconocida'}"
                    echo "  🎯 Tipo:             ${env.IS_MANUAL_BUILD == 'true' ? '👤 MANUAL' : '🤖 AUTOMÁTICO (push)'}"
                    echo "  🚦 Modo Pipeline:    ${env.PIPELINE_MODE == 'DEPLOYMENT' ? '🚀 DESPLIEGUE DIRIGIDO' : '🔧 MODO LIBRE'}"
                    echo "  👤 Lanzado por:      ${causes[0]?.shortDescription ?: 'automático'}"
                    echo "  🕐 Hora inicio:      ${new Date().format('yyyy-MM-dd HH:mm:ss')}"
                    echo '───────────────────────────────────────────────────────────────'
                    if (env.PIPELINE_MODE == 'DEPLOYMENT') {
                        echo "  📦 MODULES:          ${params.MODULES}"
                        echo "  🏢 ENVIRONMENTS:     ${params.ENVIRONMENTS}"
                        echo "  🏷  VERSION:          ${params.VERSION ?: '(no especificada)'}"
                        echo "  🧪 TEST_TYPE:        ${params.TEST_TYPE}"
                        echo "  🔁 EXECUTION_MODE:   ${params.EXECUTION_MODE}"
                    } else {
                        echo "  🧪 Suite:            ${params.TEST_SUITE}"
                        echo "  📦 Módulo:           ${params.MODULE ?: '(todos)'}"
                        echo "  🔎 Grep extra:       ${params.EXTRA_GREP ?: '(ninguno)'}"
                        echo "  🌍 Forzar todo:      ${params.FORCE_FULL_SUITE}"
                    }
                    echo '───────────────────────────────────────────────────────────────'
                    echo "  🌐 URL aplicación:   ${env.BASE_URL}"
                    echo "  💾 Cache browsers:   ${env.PLAYWRIGHT_BROWSERS_PATH}"
                    echo "  📂 Workspace:        ${env.WORKSPACE}"
                    echo '═══════════════════════════════════════════════════════════════'
                }
            }
        }

        // ───────────────────────────────────────────────────────────────────
        // GUARD DE RAMA: DEPLOY_ONLY_BRANCH SOLO puede correr en Modo
        // Despliegue. Si no hay ENVIRONMENTS+MODULES, el build se detiene
        // aquí (NOT_BUILT) y ningún stage posterior se ejecuta.
        // ───────────────────────────────────────────────────────────────────
        stage('🔒 Control de Rama') {
            steps {
                script {
                    if (env.IS_DEPLOY_ONLY_BRANCH == 'true' && env.PIPELINE_MODE == 'FREE') {
                        echo "⛔ La rama ${DEPLOY_ONLY_BRANCH} únicamente ejecuta pruebas en Modo Despliegue."
                        echo '   Debes especificar ENVIRONMENTS y MODULES al lanzar el build'
                        echo '   (o conectar esta pipeline a tu orquestador de despliegues).'
                        currentBuild.result = 'NOT_BUILT'
                        currentBuild.description = "⏭ ${DEPLOY_ONLY_BRANCH}: faltan ENVIRONMENTS/MODULES"
                    }
                }
            }
        }

        // ─── Validación de parámetros (solo Modo Despliegue) ───
        stage('✅ Validación Modo Despliegue') {
            when {
                allOf {
                    expression { currentBuild.result != 'NOT_BUILT' }
                    expression { env.PIPELINE_MODE == 'DEPLOYMENT' }
                }
            }
            steps {
                script {
                    def validation = validateDeploymentParams()
                    if (!validation.valid) {
                        error "❌ Validación fallida:\n  • ${validation.errors.join('\n  • ')}"
                    }
                    env.RESOLVED_MODULE_TAGS = validation.moduleTags.join(',')
                    env.RESOLVED_ENVIRONMENTS = validation.environments.join(',')

                    echo "✅ MODULES válidos → tags: ${validation.moduleTags.collect { '@' + it }.join(', ')}"
                    echo "✅ ENVIRONMENTS validados: ${env.RESOLVED_ENVIRONMENTS}"
                }
            }
        }

        // ─── Detección de cambios (solo Modo Libre; nunca corre en DEPLOY_ONLY_BRANCH) ───
        stage('🧐 Detección de Cambios') {
            when {
                allOf {
                    expression { currentBuild.result != 'NOT_BUILT' }
                    expression { env.PIPELINE_MODE == 'FREE' }
                    expression { env.IS_MANUAL_BUILD == 'false' }
                    expression { !params.FORCE_FULL_SUITE }
                }
            }
            steps {
                script {
                    def commitMsg = powershell(returnStdout: true, script: 'git log -1 --pretty=%B').trim()
                    if (commitMsg.toLowerCase().contains('[ci skip]') ||
                        commitMsg.toLowerCase().contains('[skip ci]')) {
                        echo '⏭  Detectado [ci skip] en mensaje del commit. Saltando build.'
                        currentBuild.result = 'NOT_BUILT'
                        currentBuild.description = '⏭ [ci skip] en commit'
                        return
                    }

                    def decision = analyzeChanges()
                    env.CHANGE_DECISION = decision.action
                    env.CHANGE_TARGET   = decision.target ?: ''

                    echo '───────────────────────────────────────────────────────────────'
                    echo "  📋 Archivos cambiados: ${decision.fileCount}"
                    echo "  🎬 Acción decidida:    ${decision.action}"
                    if (decision.target) echo "  🎯 Target:             ${decision.target}"
                    if (decision.reason) echo "  💡 Razón:              ${decision.reason}"
                    echo '───────────────────────────────────────────────────────────────'

                    if (decision.action == 'SKIP') {
                        echo '⏭  Solo se modificaron archivos no relacionados con pruebas.'
                        echo '   El build se marca como NOT_BUILT y termina aquí.'
                        currentBuild.result = 'NOT_BUILT'
                        currentBuild.description = "⏭ ${decision.reason}"
                    }
                }
            }
        }

        stage('📦 Instalación de Dependencias') {
            when {
                expression { currentBuild.result != 'NOT_BUILT' }
            }
            steps {
                echo '▶ Verificando versiones de Node y npm...'
                powershell 'node --version; npm --version'
                echo '▶ Ejecutando npm ci (instalación reproducible desde package-lock.json)...'
                powershell 'npm ci'
                echo '✅ Dependencias instaladas correctamente'
            }
            post {
                failure {
                    echo '❌ FALLO: No se pudieron instalar las dependencias'
                    echo '   Posibles causas:'
                    echo '   • package-lock.json desactualizado o corrupto'
                    echo '   • Sin acceso a registry.npmjs.org'
                    echo '   • Versión de Node incompatible'
                }
            }
        }

        stage('🌐 Preparación de Navegadores') {
            when {
                expression { currentBuild.result != 'NOT_BUILT' }
            }
            steps {
                echo '▶ Instalando navegadores de Playwright (según playwright.config.js)...'
                powershell '''
                    if (!(Test-Path $env:PLAYWRIGHT_BROWSERS_PATH)) {
                        New-Item -ItemType Directory -Force -Path $env:PLAYWRIGHT_BROWSERS_PATH | Out-Null
                    }
                    npx playwright install chromium firefox webkit
                '''
                echo '✅ Navegadores listos'
            }
            post {
                failure {
                    echo '❌ FALLO: No se pudieron preparar los navegadores'
                    echo '   Verifica acceso a cdn.playwright.dev'
                    echo '   Verifica permisos en el directorio de cache'
                }
            }
        }

        // ─── Ejecución Modo Despliegue (DEPLOY_ONLY_BRANCH, o modo libre para testing) ───
        stage('🚀 Ejecución Modo Despliegue') {
            when {
                allOf {
                    expression { currentBuild.result != 'NOT_BUILT' }
                    expression { env.PIPELINE_MODE == 'DEPLOYMENT' }
                }
            }
            steps {
                script {
                    def ambientes  = env.RESOLVED_ENVIRONMENTS.split(',') as List
                    def moduleTags = env.RESOLVED_MODULE_TAGS.split(',') as List

                    powershell '''
                        if (Test-Path allure-results) { Remove-Item -Recurse -Force allure-results }
                        if (Test-Path playwright-report) { Remove-Item -Recurse -Force playwright-report }
                        New-Item -ItemType Directory -Force -Path allure-results | Out-Null
                    '''

                    if (params.EXECUTION_MODE == 'all_environments_together') {
                        echo '🔁 Modo: TODOS LOS AMBIENTES JUNTOS'
                        runDeploymentTestsForEnvironment(moduleTags, ambientes, params.TEST_TYPE, 'combined')
                    } else {
                        echo "🔁 Modo: UNO POR UNO (${ambientes.size()} ambientes)"
                        def fallosPorAmbiente = [:]
                        ambientes.eachWithIndex { ambiente, idx ->
                            echo ''
                            echo '═══════════════════════════════════════════════════════════════'
                            echo "  🏢 [${idx + 1}/${ambientes.size()}] Ambiente: ${ambiente}"
                            echo '═══════════════════════════════════════════════════════════════'
                            try {
                                runDeploymentTestsForEnvironment(moduleTags, [ambiente], params.TEST_TYPE, ambiente)
                                echo "✅ ${ambiente}: OK"
                            } catch (Exception e) {
                                fallosPorAmbiente[ambiente] = e.message
                                echo "❌ ${ambiente}: FALLÓ — ${e.message.take(200)}"
                            }
                        }

                        if (fallosPorAmbiente) {
                            echo ''
                            echo '═══════════════════════════════════════════════════════════════'
                            echo "  ❌ RESUMEN DE FALLOS (${fallosPorAmbiente.size()}/${ambientes.size()})"
                            echo '═══════════════════════════════════════════════════════════════'
                            fallosPorAmbiente.each { amb, msg -> echo "  • ${amb}: ${msg.take(150)}" }
                            error "Hubo fallos en ${fallosPorAmbiente.size()} ambientes: ${fallosPorAmbiente.keySet().join(', ')}"
                        }
                    }
                }
            }
        }

        // ─── Resolución de Filtros (Modo Libre) ───
        stage('🎯 Resolución de Filtros') {
            when {
                allOf {
                    expression { currentBuild.result != 'NOT_BUILT' }
                    expression { env.PIPELINE_MODE == 'FREE' }
                }
            }
            steps {
                script {
                    echo '▶ Construyendo patrón --grep según parámetros y rama...'

                    if (env.IS_MANUAL_BUILD == 'true' || params.FORCE_FULL_SUITE) {
                        echo '▶ Modo: Usando parámetros del formulario'
                        echo '  (build manual o FORCE_FULL_SUITE activo)'

                        def suite = params.TEST_SUITE
                        if (suite == 'auto') {
                            // 🔧 Punto de extensión: aquí puedes decidir la suite según
                            // env.BRANCH_NAME si quieres comportamiento distinto por rama.
                            suite = 'all'
                            echo "  ↳ Modo 'auto' → suite '${suite}'"
                        }

                        def patterns = []
                        if (suite == 'smoke') {
                            patterns << '@smoke'
                            echo '  ↳ Filtro smoke: @smoke'
                        }
                        if (suite == 'regression') {
                            patterns << '@regression|@smoke|@critical'
                            echo '  ↳ Filtro regression: @regression|@smoke|@critical'
                        }
                        if (params.MODULE?.trim()) {
                            patterns << "@${params.MODULE.trim()}"
                            echo "  ↳ Filtro módulo: @${params.MODULE.trim()}"
                        }
                        if (params.EXTRA_GREP?.trim()) {
                            patterns << params.EXTRA_GREP.trim()
                            echo "  ↳ Filtro extra: ${params.EXTRA_GREP.trim()}"
                        }

                        env.GREP_PATTERN = patterns ? patterns.collect { "(?=.*${it})" }.join('') : ''
                        env.SPEC_PATHS = ''

                        if (env.GREP_PATTERN?.trim()) {
                            echo "✅ Patrón --grep final: ${env.GREP_PATTERN}"
                        } else {
                            echo '✅ Sin filtros → se ejecutarán TODAS las pruebas'
                        }
                    } else {
                        echo '▶ Modo: Automático basado en archivos cambiados'

                        env.GREP_PATTERN = ''
                        if (env.CHANGE_DECISION == 'RUN_TARGET') {
                            env.SPEC_PATHS = env.CHANGE_TARGET
                            echo "🎯 Se ejecutarán específicamente: ${env.SPEC_PATHS}"
                        } else {
                            env.SPEC_PATHS = ''
                            echo '🌍 Se ejecutará la SUITE COMPLETA'
                        }
                    }
                }
            }
        }

        // ─── Ejecución (Modo Libre) ───
        stage('🚀 Ejecución de Pruebas') {
            when {
                allOf {
                    expression { currentBuild.result != 'NOT_BUILT' }
                    expression { env.PIPELINE_MODE == 'FREE' }
                }
            }
            steps {
                script {
                    echo '▶ Limpiando resultados de builds anteriores...'
                }
                powershell '''
                    if (Test-Path allure-results) { Remove-Item -Recurse -Force allure-results }
                    if (Test-Path playwright-report) { Remove-Item -Recurse -Force playwright-report }
                '''
                script {
                    echo '▶ Iniciando Playwright...'

                    def cmdParts = ['npx playwright test']
                    if (env.SPEC_PATHS?.trim()) {
                        cmdParts << env.SPEC_PATHS
                    }
                    if (env.GREP_PATTERN?.trim()) {
                        cmdParts << "--grep '${env.GREP_PATTERN}'"
                    }
                    def cmd = cmdParts.join(' ')
                    echo "🔎 Comando: ${cmd}"

                    if (USE_LOGIN_CREDENTIALS) {
                        withCredentials([
                            string(credentialsId: DEFAULT_USER_CRED, variable: 'USER_GENERIC'),
                            string(credentialsId: DEFAULT_PASS_CRED, variable: 'PASSWORD_UNIVERSAL')
                        ]) {
                            powershell cmd
                        }
                    } else {
                        powershell cmd
                    }

                    echo ''
                    echo '✅ Todas las pruebas pasaron exitosamente'
                }
            }
            post {
                failure {
                    echo ''
                    echo '═══════════════════════════════════════════════════════════════'
                    echo '  ❌ FALLO EN EJECUCIÓN DE PRUEBAS'
                    echo '═══════════════════════════════════════════════════════════════'
                    echo '  Diagnóstico sugerido:'
                    echo '  1. Revisa el reporte Allure (menú izquierdo del build)'
                    echo '  2. Descarga los artefactos de test-results para ver traces/videos/screenshots'
                    echo '  3. Si falló en globalSetup: revisa conectividad y disponibilidad de la app'
                    echo '  4. Si falló un test puntual: revisa su trace en'
                    echo '     test-results/[nombre-test]/trace.zip (npx playwright show-trace)'
                    echo '═══════════════════════════════════════════════════════════════'
                }
            }
        }
    }

    post {
        always {
            script {
                if (currentBuild.result != 'NOT_BUILT') {
                    echo ''
                    echo '═══════════════════════════════════════════════════════════════'
                    echo '  📊 GENERANDO REPORTE ALLURE'
                    echo '═══════════════════════════════════════════════════════════════'
                }
            }
            allure([
                includeProperties: false,
                jdk: '',
                results: [[path: 'allure-results']]
            ])
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true, fingerprint: false
            archiveArtifacts artifacts: 'test-results/**',      allowEmptyArchive: true, fingerprint: false
            script {
                def duration = currentBuild.durationString.replace(' and counting', '')
                echo ''
                echo '═══════════════════════════════════════════════════════════════'
                echo "  ⏱  Duración total del build: ${duration}"
                echo '═══════════════════════════════════════════════════════════════'
            }
        }
        success {
            script {
                if (currentBuild.result == 'NOT_BUILT') {
                    echo ''
                    echo '⏭  ═══════════════════════════════════════════════════════════════'
                    echo "  BUILD #${env.BUILD_NUMBER} - SIN EJECUCIÓN DE PRUEBAS"
                    echo '⏭  ═══════════════════════════════════════════════════════════════'
                    echo "  ${currentBuild.description ?: 'No se requirieron pruebas para este cambio'}"
                } else {
                    echo ''
                    echo '✅ ═══════════════════════════════════════════════════════════════'
                    echo "  🎉 BUILD #${env.BUILD_NUMBER} EXITOSO"
                    echo '✅ ═══════════════════════════════════════════════════════════════'
                    echo '   Reporte Allure disponible en el menú izquierdo del build'
                }
            }
        }
        failure {
            script {
                echo ''
                echo '❌ ═══════════════════════════════════════════════════════════════'
                echo "  💥 BUILD #${env.BUILD_NUMBER} FALLÓ"
                echo '❌ ═══════════════════════════════════════════════════════════════'
                echo '   📋 Pasos para diagnosticar:'
                echo '   1. Revisa el reporte Allure (menú izquierdo)'
                echo '   2. Descarga los artefactos de test-results para ver:'
                echo '      • Screenshots del momento del fallo'
                echo '      • Videos de la sesión'
                echo '      • Traces (npx playwright show-trace trace.zip)'
                echo '   3. Revisa logs de stages anteriores en este mismo build'
            }
        }
        unstable {
            script {
                echo ''
                echo '⚠  BUILD INESTABLE - algunas pruebas fallaron pero el pipeline completó'
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES — DETECCIÓN DE CAMBIOS (Modo Libre)
// ═══════════════════════════════════════════════════════════════════════════

def analyzeChanges() {
    def MODULE_MAP = getChangeDetectionModuleMap()

    // Archivos que nunca disparan pruebas por sí solos.
    def IGNORED = [
        ~/^Jenkinsfile$/,
        ~/^Jenkinsfile\..*$/,
        ~/^playwright\.config\.js$/,
        ~/^\.gitignore$/,
        ~/^\.env\.example$/,
        ~/^.*\.md$/,
        ~/^docs\/.*/,
    ]

    // Archivos compartidos por todas las pruebas: cualquier cambio aquí
    // dispara la suite completa por seguridad.
    // 🔧 Ajusta esta lista si tu proyecto organiza page objects/fixtures/
    // utilidades en otras rutas.
    def GLOBAL = [
        ~/^pages\/.*/,
        ~/^utilidades\/.*/,
        ~/^suite-pruebas\/.*/,
        ~/^package\.json$/,
        ~/^package-lock\.json$/,
    ]

    def previousCommit = env.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: env.GIT_PREVIOUS_COMMIT ?: 'HEAD~1'
    def gitOutput = ''
    try {
        gitOutput = powershell(
            returnStdout: true,
            script: """
                \$diff = git diff --name-only ${previousCommit} HEAD 2>\$null
                if (\$LASTEXITCODE -ne 0 -or -not \$diff) {
                    \$diff = git diff --name-only HEAD~1 HEAD 2>\$null
                }
                \$diff
            """
        ).trim()
    } catch (Exception e) {
        echo "⚠ No se pudo obtener diff (${e.message}). Por seguridad → RUN_ALL"
        return [action: 'RUN_ALL', fileCount: 0, reason: 'No se pudo obtener diff de git']
    }

    def files = gitOutput.split('\n').findAll { it?.trim() }

    if (files.isEmpty()) {
        return [action: 'RUN_ALL', fileCount: 0, reason: 'No se detectaron archivos cambiados']
    }

    echo 'Archivos modificados detectados:'
    files.each { echo "  • ${it}" }

    def globalHits  = []
    def ignoredHits = []
    def specHits    = [] as Set

    files.each { file ->
        if (GLOBAL.any { file ==~ it }) { globalHits << file; return }
        if (IGNORED.any { file ==~ it }) { ignoredHits << file; return }

        // tests/<modulo>/algo.spec.js → si <modulo> está en el mapa, se
        // corre solo la carpeta configurada para ese módulo.
        def moduleSpecMatch = file =~ /^tests\/([^\/]+)\/.+\.spec\.js$/
        if (moduleSpecMatch) {
            def moduleName = moduleSpecMatch[0][1]
            def target = MODULE_MAP[moduleName]
            if (target) {
                specHits << target
            } else {
                echo "⚠ Módulo '${moduleName}' no está en getChangeDetectionModuleMap(). Por seguridad → suite completa."
                globalHits << file
            }
            return
        }

        // Spec suelto directamente en tests/ (sin subcarpeta de módulo): se ejecuta a sí mismo.
        def specMatch = file =~ /^tests\/(.+\.spec\.js)$/
        if (specMatch) { specHits << file; return }

        echo "⚠ Archivo '${file}' no clasificado. Por seguridad → suite completa."
        globalHits << file
    }

    if (globalHits) {
        return [action: 'RUN_ALL', fileCount: files.size(),
                reason: "Cambios en archivos globales o sin clasificar (${globalHits.size()} archivos)"]
    }
    if (!specHits && ignoredHits) {
        def ignoredNames = ignoredHits.collect { it.tokenize('/').last() }
        return [action: 'SKIP', fileCount: files.size(),
                reason: "Solo cambios en archivos ignorados: ${ignoredNames.join(', ')}"]
    }
    if (!specHits) {
        return [action: 'RUN_ALL', fileCount: files.size(), reason: 'Sin clasificación clara']
    }
    return [action: 'RUN_TARGET', target: specHits.join(' '), fileCount: files.size(),
            reason: 'Tests focalizados según cambios detectados']
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES — MODO DESPLIEGUE
// ═══════════════════════════════════════════════════════════════════════════

def validateDeploymentParams() {
    def moduleMap = getModuleTagMap()
    def environmentsMap = getEnvironmentsMap()
    def errors = []

    def modulosSolicitados     = params.MODULES.split(',').collect { it.trim() }.findAll { it }
    def ambientesSolicitados   = params.ENVIRONMENTS.split(',').collect { it.trim() }.findAll { it }

    def moduleTags = []
    modulosSolicitados.each { modulo ->
        def tag = moduleMap[modulo]
        if (!tag) {
            errors << "MODULE desconocido: '${modulo}'. Revisa getModuleTagMap()."
        } else {
            moduleTags << tag
        }
    }

    ambientesSolicitados.each { ambiente ->
        if (!environmentsMap.containsKey(ambiente)) {
            errors << "ENVIRONMENT desconocido: '${ambiente}'. Revisa getEnvironmentsMap()."
        }
    }

    if (moduleTags.isEmpty()) errors << 'No se resolvió ningún MODULE válido'
    if (ambientesSolicitados.isEmpty()) errors << 'No se especificó ningún ENVIRONMENT'

    return [
        valid: errors.isEmpty(),
        errors: errors,
        moduleTags: moduleTags.unique(),
        environments: ambientesSolicitados.unique()
    ]
}

/**
 * Resuelve qué credenciales usar para un ambiente, con fallback al genérico.
 * Solo se invoca si USE_LOGIN_CREDENTIALS = true. El chequeo de existencia
 * está aislado (no-op trivial) de la ejecución real de tests, para que un
 * fallo de prueba nunca se confunda con "credencial no encontrada".
 */
def resolveCredentialIds(String ambiente) {
    def specificUser = "${ambiente.toUpperCase()}_USER"
    def specificPass = "${ambiente.toUpperCase()}_PASS"

    try {
        withCredentials([
            string(credentialsId: specificUser, variable: 'CHK_USER'),
            string(credentialsId: specificPass, variable: 'CHK_PASS')
        ]) {
            powershell 'exit 0'
        }
        echo "  🔑 Usando credenciales específicas: ${specificUser}/${specificPass}"
        return [userCredId: specificUser, passCredId: specificPass, source: 'ambiente']
    } catch (Exception e) {
        echo "  🔑 Sin credenciales específicas (${specificUser}). Usando ${DEFAULT_USER_CRED}/${DEFAULT_PASS_CRED}"
        return [userCredId: DEFAULT_USER_CRED, passCredId: DEFAULT_PASS_CRED, source: 'generic']
    }
}

/**
 * Ejecuta tests para uno o varios ambientes (según EXECUTION_MODE).
 */
def runDeploymentTestsForEnvironment(List moduleTags, List ambientes, String testType, String label) {
    def moduleAlt = moduleTags.collect { "@${it}" }.join('|')
    def ambienteAlt = ambientes.collect { "@${it}" }.join('|')

    def lookaheads = [
        "(?=.*(${moduleAlt}))",
        "(?=.*(${ambienteAlt}))"
    ]

    if (testType == 'e2e')        lookaheads << '(?=.*@e2e)'
    if (testType == 'smoke')      lookaheads << '(?=.*@smoke)'
    if (testType == 'regression') lookaheads << '(?=.*(@regression|@smoke|@critical))'
    if (testType == 'critical')   lookaheads << '(?=.*@critical)'
    // 'all' no agrega filtro de tipo: corre todos los tipos para el módulo/ambiente dado.

    def grepPattern = lookaheads.join('')

    def environmentsMap = getEnvironmentsMap()
    def baseUrl = ambientes.size() == 1 ? environmentsMap[ambientes[0]] : env.BASE_URL

    echo "  🔎 Grep:      ${grepPattern}"
    echo "  🌐 BASE_URL:  ${baseUrl}"

    def allureDir = "allure-results-${label}"
    def testCmd = """
        \$env:BASE_URL = '${baseUrl}'
        \$env:ALLURE_RESULTS_DIR = '${allureDir}'
        if (Test-Path ${allureDir}) { Remove-Item -Recurse -Force ${allureDir} }
        New-Item -ItemType Directory -Force -Path ${allureDir} | Out-Null

        npx playwright test --grep '${grepPattern}'

        if (Test-Path ${allureDir}) {
            Copy-Item -Path "${allureDir}/*" -Destination allure-results -Recurse -Force -ErrorAction SilentlyContinue
        }
    """

    if (USE_LOGIN_CREDENTIALS) {
        def creds = ambientes.size() == 1
            ? resolveCredentialIds(ambientes[0])
            : [userCredId: DEFAULT_USER_CRED, passCredId: DEFAULT_PASS_CRED, source: 'generic-combined']
        echo "  🔑 Creds:     ${creds.userCredId}/${creds.passCredId} (origen: ${creds.source})"
        withCredentials([
            string(credentialsId: creds.userCredId, variable: 'USER_GENERIC'),
            string(credentialsId: creds.passCredId, variable: 'PASSWORD_UNIVERSAL')
        ]) {
            powershell testCmd
        }
    } else {
        powershell testCmd
    }
}
