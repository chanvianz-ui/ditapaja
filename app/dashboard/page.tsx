                  <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" />
                  Review Clicks
                </span>
              </div>

              <div className="mt-5 flex h-56 items-end gap-1 border-b border-slate-100 pb-2 sm:gap-2">
                {chartData.map((day) => (
                  <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div className="flex h-full items-end justify-center gap-0.5 sm:gap-1">
                      <div
                        title={`${day.taps} taps`}
                        className="w-1/2 max-w-5 rounded-t-md bg-blue-600 transition-all"
                        style={{ height: `${(day.taps / chartMax) * 100}%`, minHeight: day.taps > 0 ? "3px" : "0" }}
                      />
                      <div
                        title={`${day.clicks} review clicks`}
                        className="w-1/2 max-w-5 rounded-t-md bg-sky-300 transition-all"
                        style={{ height: `${(day.clicks / chartMax) * 100}%`, minHeight: day.clicks > 0 ? "3px" : "0" }}
                      />
                    </div>
                    {(chartPeriod === 7 || chartData.indexOf(day) % (chartPeriod === 30 ? 5 : 15) === 0) && (
                      <span className="mt-2 truncate text-center text-[10px] text-slate-400">
                        {day.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {eventRows.length === 0 && (
                <p className="mt-4 text-center text-xs text-slate-400">
                  Belum ada aktivitas untuk ditampilkan.
                </p>
              )}
            </section>

            {analyticsError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {analyticsError}
              </div>
            )}

            {/* NFC CARDS */}
            <div
              id="cards"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="font-bold">My NFC Cards</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Kelola semua kartu NFC kamu.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {cards.length} Cards
                </span>
              </div>

              {cards.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <CreditCard size={26} />
                  </div>

                  <h4 className="mt-5 font-semibold">
                    Belum ada kartu NFC
                  </h4>

                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    Tambahkan kartu NFC pertama kamu untuk mulai
                    mengumpulkan data tap.
                  </p>

                  <button
                    onClick={() =>
                      router.push("/dashboard/cards/new")
                    }
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Tambahkan Kartu
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-6"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {card.card_name || "Untitled Card"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Code: {card.public_code}
                        </p>

                        <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                          {card.destination_url}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          card.active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {card.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-400">
              DiTapAja · Free Dashboard · No Monthly Subscription
            </p>
          </div>
        </section>
      </div>
    </main>
